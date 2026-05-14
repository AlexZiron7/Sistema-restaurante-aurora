const path = require('path');
const fs = require('fs');

module.exports = function (app, io, deps) {
  const BACKUPS_DIR = path.resolve(__dirname, '..', '..', 'backups');
  const DB_PATH = path.resolve(__dirname, '..', '..', 'restaurante.db');

  function ensureDir() {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
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
      fs.copyFileSync(DB_PATH, path.join(BACKUPS_DIR, nombre));
      const stats = fs.statSync(path.join(BACKUPS_DIR, nombre));
      res.json({ success: true, backup: { nombre, tamaño: stats.size, fecha: new Date().toISOString() } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/backups', (req, res) => {
    ensureDir();
    try {
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.endsWith('.db'))
        .map(f => {
          const s = fs.statSync(path.join(BACKUPS_DIR, f));
          return { nombre: f, tamaño: s.size, fecha: s.mtime.toISOString() };
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      res.json(files);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/backups/restore/:filename', (req, res) => {
    const backupPath = path.join(BACKUPS_DIR, req.params.filename);
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup no encontrado' });
    }
    try {
      fs.copyFileSync(backupPath, DB_PATH);
      res.json({ success: true, message: 'Backup restaurado. Reinicia el servidor para aplicar los cambios.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/backups/:filename', (req, res) => {
    const backupPath = path.join(BACKUPS_DIR, req.params.filename);
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
