const path = require('path');
const fs = require('fs');

module.exports = function (app, io, deps) {
  const { appRoot } = deps;

  function getBackupsDir() {
    return path.resolve(appRoot, 'backups');
  }

  function getDbPath() {
    return path.resolve(appRoot, 'restaurante.db');
  }

  function isSafeFilename(name) {
    return /^[\w\-.]+$/.test(name) && !name.includes('..');
  }

  function ensureDir() {
    const dir = getBackupsDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  app.post('/api/backups', (req, res) => {
    if (process.env.VITEST_DB) {
      return res.status(400).json({ success: false, message: 'No disponible en modo prueba' });
    }
    ensureDir();
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const nombre = `restaurante-${timestamp}.db`;
      fs.copyFileSync(getDbPath(), path.join(getBackupsDir(), nombre));
      const stats = fs.statSync(path.join(getBackupsDir(), nombre));
      res.json({ success: true, backup: { nombre, tamaño: stats.size, fecha: new Date().toISOString() } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/backups', (req, res) => {
    ensureDir();
    try {
      const files = fs.readdirSync(getBackupsDir())
        .filter(f => f.endsWith('.db'))
        .map(f => {
          const s = fs.statSync(path.join(getBackupsDir(), f));
          return { nombre: f, tamaño: s.size, fecha: s.mtime.toISOString() };
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      res.json(files);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/backups/restore/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!isSafeFilename(filename)) {
      return res.status(400).json({ success: false, message: 'Nombre de archivo inválido' });
    }
    const backupPath = path.join(getBackupsDir(), filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup no encontrado' });
    }
    try {
      fs.copyFileSync(backupPath, getDbPath());
      res.json({ success: true, message: 'Backup restaurado. Reinicia el servidor para aplicar los cambios.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/backups/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!isSafeFilename(filename)) {
      return res.status(400).json({ success: false, message: 'Nombre de archivo inválido' });
    }
    const backupPath = path.join(getBackupsDir(), filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup no encontrado' });
    }
    try {
      fs.unlinkSync(backupPath);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
};
