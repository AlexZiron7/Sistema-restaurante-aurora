module.exports = function (app, io, deps) {
  const { getDb, obtenerTasaBCV, requireRol } = deps;

  app.get('/api/tasa-bcv', (req, res) => {
    const db = getDb();
    db.get("SELECT valor, updated_at FROM config WHERE clave = 'tasa_bcv'", (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        tasa: row ? parseFloat(row.valor) : 0,
        updated_at: row?.updated_at
      });
    });
  });

  app.post('/api/tasa-bcv/actualizar', requireRol('admin'), async (req, res) => {
    const db = getDb();
    const tasa = await obtenerTasaBCV();
    if (tasa) {
      db.run("UPDATE config SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = 'tasa_bcv'", [tasa.toString()]);
      res.json({ success: true, tasa });
    } else {
      res.status(500).json({ success: false, message: 'No se pudo obtener la tasa' });
    }
  });

  app.get('/api/config', (req, res) => {
    const db = getDb();
    db.all("SELECT clave, valor FROM config", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const config = {};
      rows.forEach(row => {
        if (row.valor === 'true' || row.valor === 'false') {
          config[row.clave] = row.valor === 'true';
        } else {
          config[row.clave] = row.valor;
        }
      });

      res.json(config);
    });
  });

  app.post('/api/config', requireRol('admin'), (req, res) => {
    const db = getDb();
    const { clave, valor } = req.body;

    db.run("UPDATE config SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = ?", [valor.toString(), clave], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
};
