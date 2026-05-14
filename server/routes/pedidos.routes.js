module.exports = function (app, io, deps) {
  const { getDb } = deps;

  app.post('/api/pedidos', (req, res) => {
    const db = getDb();
    const { id_mesa, id_mesonero, items } = req.body;

    db.serialize(() => {
      db.run("INSERT INTO pedidos (id_mesa, id_mesonero) VALUES (?, ?)", [id_mesa, id_mesonero], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const id_pedido = this.lastID;

        const stmt = db.prepare("INSERT INTO items_pedido (id_pedido, nombre_producto, precio, notas_especiales) VALUES (?, ?, ?, ?)");
        items.forEach(item => {
          stmt.run(id_pedido, item.nombre, item.precio, item.notas || "");
        });
        stmt.finalize();

        db.run("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [id_mesa]);

        io.emit('nuevo_pedido', { id_pedido, id_mesa });
        io.emit('mesa_actualizada', { id: id_mesa, estado: 'ocupada' });

        res.json({ success: true, id_pedido });
      });
    });
  });

  app.post('/api/pedidos/:id/items', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { items } = req.body;

    db.serialize(() => {
      const stmt = db.prepare("INSERT INTO items_pedido (id_pedido, nombre_producto, precio, notas_especiales) VALUES (?, ?, ?, ?)");
      items.forEach(item => {
        stmt.run(id, item.nombre, item.precio, item.notas || "");
      });
      stmt.finalize();

      db.get("SELECT id_mesa FROM pedidos WHERE id = ?", [id], (err, row) => {
        const id_mesa = row ? row.id_mesa : null;
        if (id_mesa) {
          db.run("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [id_mesa]);
          io.emit('mesa_actualizada', { id: id_mesa, estado: 'ocupada' });
        }
        io.emit('pedido_actualizado', { id_pedido: parseInt(id), id_mesa });
        if (id_mesa) io.emit('nuevo_pedido', { id_pedido: parseInt(id), id_mesa });
        res.json({ success: true });
      });
    });
  });

  app.delete('/api/pedidos/:id/items/:itemId', (req, res) => {
    const db = getDb();
    const { id, itemId } = req.params;

    db.run("DELETE FROM items_pedido WHERE id = ? AND id_pedido = ?", [itemId, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      io.emit('pedido_actualizado', { id_pedido: parseInt(id) });
      res.json({ success: true });
    });
  });

  app.get('/api/pedidos/:id/ticket', (req, res) => {
    const db = getDb();
    const { id } = req.params;

    db.get(`
        SELECT p.*, m.numero_mesa, u.nombre as mesonero_nombre
        FROM pedidos p
        JOIN mesas m ON p.id_mesa = m.id
        JOIN usuarios u ON p.id_mesonero = u.id
        WHERE p.id = ?
    `, [id], (err, pedido) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

      db.all(`
            SELECT * FROM items_pedido WHERE id_pedido = ?
        `, [id], (err, items) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          ...pedido,
          items,
          fecha: new Date().toLocaleString('es-VE')
        });
      });
    });
  });

  app.get('/api/pedidos/historial', (req, res) => {
    const db = getDb();
    const { desde, hasta, metodo, limit = 50, offset = 0 } = req.query;
    const fechaDesde = desde || new Date().toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    let whereExtra = '';
    let params = [fechaDesde, fechaHasta];

    if (metodo && metodo !== 'todos') {
      whereExtra = ' AND p.metodo_pago = ?';
      params.push(metodo);
    }

    db.get(`
        SELECT COUNT(*) as total
        FROM pedidos p
        WHERE p.estado = 'pagado' AND date(p.fecha_cierre) BETWEEN ? AND ?${whereExtra}
    `, params, (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });

      params.push(parseInt(limit), parseInt(offset));
      db.all(`
            SELECT 
                p.*,
                (
                    SELECT GROUP_CONCAT(ip.nombre_producto, ', ')
                    FROM items_pedido ip WHERE ip.id_pedido = p.id
                ) as items_resumen,
                (
                    SELECT COUNT(*) FROM items_pedido ip WHERE ip.id_pedido = p.id
                ) as total_items
            FROM pedidos p
            WHERE p.estado = 'pagado' AND date(p.fecha_cierre) BETWEEN ? AND ?${whereExtra}
            ORDER BY p.fecha_cierre DESC
            LIMIT ? OFFSET ?
        `, params, (err2, rows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ total: countRow.total, pedidos: rows });
      });
    });
  });

  app.get('/api/pedidos/:id/detalle', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.get("SELECT * FROM pedidos WHERE id = ?", [id], (err, pedido) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
      db.all("SELECT * FROM items_pedido WHERE id_pedido = ?", [id], (err2, items) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ...pedido, items });
      });
    });
  });
};
