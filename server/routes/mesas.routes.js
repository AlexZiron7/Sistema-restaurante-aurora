module.exports = function (app, io, deps) {
  const { getDb, requireRol } = deps;

  app.get('/api/mesas', (req, res) => {
    const db = getDb();
    db.all("SELECT * FROM mesas ORDER BY numero_mesa", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/mesas', requireRol('admin', 'gerente'), (req, res) => {
    const db = getDb();
    const { numero_mesa, capacidad } = req.body;

    if (!numero_mesa) {
      return res.status(400).json({ success: false, message: 'El número de mesa es requerido' });
    }

    db.get("SELECT id FROM mesas WHERE numero_mesa = ?", [numero_mesa], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        return res.status(400).json({ success: false, message: 'El número de mesa ya existe' });
      }

      db.run("INSERT INTO mesas (numero_mesa, capacidad) VALUES (?, ?)",
        [numero_mesa, capacidad || 4], function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, id: this.lastID, numero_mesa, capacidad: capacidad || 4 });
        });
    });
  });

  app.put('/api/mesas/:id', requireRol('admin', 'gerente'), (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { numero_mesa, capacidad } = req.body;

    if (!numero_mesa) {
      return res.status(400).json({ success: false, message: 'El número de mesa es requerido' });
    }

    db.get("SELECT id FROM mesas WHERE numero_mesa = ? AND id != ?", [numero_mesa, id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        return res.status(400).json({ success: false, message: 'El número de mesa ya existe' });
      }

      db.run("UPDATE mesas SET numero_mesa = ?, capacidad = ? WHERE id = ?",
        [numero_mesa, capacidad || 4, id], function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        });
    });
  });

  app.delete('/api/mesas/:id', requireRol('admin', 'gerente'), (req, res) => {
    const db = getDb();
    const { id } = req.params;

    db.get("SELECT estado FROM mesas WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ success: false, message: 'Mesa no encontrada' });

      if (row.estado !== 'libre') {
        return res.status(400).json({ success: false, message: 'No se puede eliminar una mesa que está en uso' });
      }

      db.run("DELETE FROM mesas WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
  });

  app.post('/api/mesas/:id/estado', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { estado } = req.body;

    db.run("UPDATE mesas SET estado = ? WHERE id = ?", [estado, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      io.emit('mesa_actualizada', { id: parseInt(id), estado });
      res.json({ success: true });
    });
  });

  app.get('/api/mesas/:id/pedido', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const query = `
        SELECT DISTINCT ip.id, ip.id_pedido, ip.nombre_producto, ip.notas_especiales, ip.precio, ip.estado, p.id as pedido_id, p.id_mesonero, p.fecha
        FROM items_pedido ip
        JOIN pedidos p ON ip.id_pedido = p.id
        WHERE p.id_mesa = ? AND p.estado = 'abierto'
        ORDER BY ip.id ASC
    `;
    db.all(query, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/mesas/:id/cerrar', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { porcentaje_propina } = req.body;

    db.serialize(() => {
      db.get("SELECT numero_mesa FROM mesas WHERE id = ?", [id], (err, mesa) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!mesa) return res.status(404).json({ error: "Mesa no encontrada" });

        const query = `
            SELECT SUM(ip.precio) as total 
            FROM items_pedido ip
            JOIN pedidos p ON ip.id_pedido = p.id
            WHERE p.id_mesa = ? AND p.estado = 'abierto'
        `;

        db.get(query, [id], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          const total = result?.total || 0;
          const propina = total * ((porcentaje_propina || 0) / 100);

          db.run("UPDATE mesas SET estado = 'cuenta' WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            db.run("UPDATE pedidos SET total = ?, propina = ? WHERE id_mesa = ? AND estado = 'abierto'",
              [total, propina, id]);

            io.emit('mesa_cerrada', {
              id: parseInt(id),
              numero_mesa: mesa.numero_mesa,
              total,
              porcentaje_propina,
              total_con_propina: total + propina
            });

            io.emit('mesa_actualizada', {
              id: parseInt(id),
              estado: 'cuenta',
              numero_mesa: mesa.numero_mesa
            });

            res.json({
              success: true,
              total,
              porcentaje_propina,
              total_con_propina: total + propina,
              numero_mesa: mesa.numero_mesa
            });
          });
        });
      });
    });
  });

  app.post('/api/mesas/:id/cobrar', requireRol('admin', 'gerente', 'cajero'), (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { metodo_pago, datos_pago } = req.body;
    const metodoPagoFinal = metodo_pago || 'efectivo';
    const datosPagoJSON = datos_pago ? JSON.stringify(datos_pago) : null;

    db.serialize(() => {
      db.get(`
            SELECT m.numero_mesa, u.nombre as mesonero_nombre, p.id as pedido_id
            FROM mesas m
            LEFT JOIN pedidos p ON p.id_mesa = m.id AND p.estado = 'abierto'
            LEFT JOIN usuarios u ON u.id = p.id_mesonero
            WHERE m.id = ?
        `, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run("UPDATE mesas SET estado = 'limpiando' WHERE id = ?", [id], function (err) {
          if (err) return res.status(500).json({ error: err.message });
          db.run(
            `UPDATE pedidos SET 
                    estado = 'pagado', 
                    metodo_pago = ?, 
                    datos_pago = ?,
                    fecha_cierre = CURRENT_TIMESTAMP,
                    numero_mesa = ?,
                    nombre_mesonero = ?
                WHERE id_mesa = ? AND estado = 'abierto'`,
            [metodoPagoFinal, datosPagoJSON, row?.numero_mesa, row?.mesonero_nombre, id],
            function (err) {
              if (err) return res.status(500).json({ error: err.message });
              io.emit('mesa_actualizada', { id: parseInt(id), estado: 'limpiando' });
              io.emit('mesa_cobrada', { id: parseInt(id) });
              res.json({ success: true });
            }
          );
        });
      });
    });
  });
};
