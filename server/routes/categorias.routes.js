module.exports = function (app, io, deps) {
  const { getDb } = deps;

  app.get('/api/categorias', (req, res) => {
    const db = getDb();
    db.all("SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.get('/api/admin/categorias', (req, res) => {
    const db = getDb();
    db.all("SELECT * FROM categorias ORDER BY nombre", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/categorias', (req, res) => {
    const db = getDb();
    const { nombre, icono } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }
    db.run("INSERT INTO categorias (nombre, icono) VALUES (?, ?)", [nombre, icono || '🍽️'], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    });
  });

  app.put('/api/categorias/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { nombre, icono } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }
    db.run("UPDATE categorias SET nombre = ?, icono = ? WHERE id = ?", [nombre, icono || '🍽️', id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  app.delete('/api/categorias/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.get("SELECT COUNT(*) as count FROM productos WHERE id_categoria = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row.count > 0) {
        return res.status(400).json({ success: false, message: 'No se puede eliminar: hay productos asociados' });
      }
      db.run("DELETE FROM categorias WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
  });
};
