module.exports = function (app, io, deps) {
  const { getDb, upload, path, fs, appRoot, requireRol } = deps;

  app.post('/api/productos/:id/imagen', requireRol('admin', 'gerente'), upload.single('imagen'), (req, res) => {
    const db = getDb();
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subió ninguna imagen' });
    }

    const imagenUrl = `/uploads/${req.file.filename}`;

    db.run("UPDATE productos SET imagen = ? WHERE id = ?", [imagenUrl, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, imagen: imagenUrl });
    });
  });

  app.get('/api/productos/plantilla', (req, res) => {
    const csvContent = "nombre,descripcion,precio_usd,categoria\nCafé americano,Café negro intenso,2.5,Bebidas\nPizza Margarita,Salsa tomate y mozzarella,12.0,Principales\n";
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_menu.csv');
    res.status(200).send(csvContent);
  });

  app.delete('/api/productos/:id/imagen', requireRol('admin', 'gerente'), (req, res) => {
    const db = getDb();
    const { id } = req.params;

    db.get("SELECT imagen FROM productos WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row?.imagen) {
        return res.json({ success: true });
      }

      const filePath = path.join(__dirname, '..', '..', 'public', row.imagen);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      db.run("UPDATE productos SET imagen = NULL WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
  });

  app.get('/api/productos', (req, res) => {
    const db = getDb();
    const query = `
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p 
        LEFT JOIN categorias c ON p.id_categoria = c.id 
        WHERE p.activo = 1 
        ORDER BY c.nombre, p.nombre
    `;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/productos', requireRol('admin', 'gerente'), (req, res) => {
    const db = getDb();
    const { nombre, precio_usd, id_categoria, es_combo, productos_incluidos, precio_combo, descripcion } = req.body;

    if (!nombre || !precio_usd) {
      return res.status(400).json({ success: false, message: 'Nombre y precio son requeridos' });
    }

    const incString = productos_incluidos ? (typeof productos_incluidos === 'string' ? productos_incluidos : JSON.stringify(productos_incluidos)) : null;

    db.run("INSERT INTO productos (nombre, precio_usd, id_categoria, es_combo, productos_incluidos, precio_combo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre, precio_usd, id_categoria || null, es_combo ? 1 : 0, incString, precio_combo || null, descripcion || ''], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
      });
  });

  app.put('/api/productos/:id', requireRol('admin', 'gerente'), (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { nombre, precio_usd, id_categoria, activo, es_combo, productos_incluidos, precio_combo, descripcion } = req.body;

    let query = "UPDATE productos SET ";
    let params = [];
    let updates = [];

    if (nombre) { updates.push("nombre = ?"); params.push(nombre); }
    if (precio_usd !== undefined) { updates.push("precio_usd = ?"); params.push(precio_usd); }
    if (id_categoria !== undefined) { updates.push("id_categoria = ?"); params.push(id_categoria); }
    if (activo !== undefined) { updates.push("activo = ?"); params.push(activo ? 1 : 0); }
    if (es_combo !== undefined) { updates.push("es_combo = ?"); params.push(es_combo ? 1 : 0); }
    if (productos_incluidos !== undefined) {
      const incString = productos_incluidos ? (typeof productos_incluidos === 'string' ? productos_incluidos : JSON.stringify(productos_incluidos)) : null;
      updates.push("productos_incluidos = ?");
      params.push(incString);
    }
    if (precio_combo !== undefined) { updates.push("precio_combo = ?"); params.push(precio_combo || null); }
    if (descripcion !== undefined) { updates.push("descripcion = ?"); params.push(descripcion); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    query += updates.join(", ") + " WHERE id = ?";
    params.push(id);

    db.run(query, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  app.delete('/api/productos/:id', requireRol('admin', 'gerente'), (req, res) => {
    const db = getDb();
    const { id } = req.params;

    db.get("SELECT imagen FROM productos WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run("UPDATE productos SET activo = 0 WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (row?.imagen) {
          const filePath = path.join(appRoot, 'public', row.imagen);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        res.json({ success: true });
      });
    });
  });
  app.post('/api/productos/importar', requireRol('admin', 'gerente'), async (req, res) => {
    const db = getDb();
    const { productos } = req.body;

    if (!Array.isArray(productos)) {
      return res.status(400).json({ success: false, message: 'Se esperaba un array de productos' });
    }

    try {
      // Usar una transacción para mayor velocidad y seguridad
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const stmtCat = db.prepare("INSERT OR IGNORE INTO categorias (nombre, icono) VALUES (?, '🍽️')");
        const stmtProd = db.prepare("INSERT INTO productos (nombre, descripcion, precio_usd, id_categoria) VALUES (?, ?, ?, (SELECT id FROM categorias WHERE nombre = ? LIMIT 1))");

        productos.forEach(p => {
          if (p.categoria) stmtCat.run(p.categoria);
          stmtProd.run(p.nombre, p.descripcion || '', p.precio_usd || 0, p.categoria || null);
        });

        stmtCat.finalize();
        stmtProd.finalize();

        db.run("COMMIT", (err) => {
          if (err) return res.status(500).json({ success: false, error: err.message });
          res.json({ success: true, count: productos.length });
        });
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
};
