module.exports = function (app, io, deps) {
  const { getDb } = deps;

  app.get('/api/cocina/pedidos-pendientes', (req, res) => {
    const db = getDb();
    const query = `
        SELECT 
            m.id as mesa_id,
            m.numero_mesa,
            m.estado as mesa_estado,
            p.id as pedido_id,
            p.fecha as fecha_pedido,
            p.id_mesonero,
            u.nombre as mesonero_nombre
        FROM mesas m
        JOIN pedidos p ON p.id_mesa = m.id AND p.estado = 'abierto'
        LEFT JOIN usuarios u ON u.id = p.id_mesonero
        WHERE m.estado IN ('ocupada', 'atendida')
        ORDER BY p.fecha ASC
    `;

    db.all(query, [], (err, pedidos) => {
      if (err) return res.status(500).json({ error: err.message });

      if (pedidos.length === 0) {
        return res.json([]);
      }

      const pedidoIds = pedidos.map(p => p.pedido_id);
      const placeholders = pedidoIds.map(() => '?').join(',');

      const itemsQuery = `
            SELECT id, id_pedido, nombre_producto, notas_especiales, precio, estado
            FROM items_pedido
            WHERE id_pedido IN (${placeholders}) AND estado = 'en_cocina'
            ORDER BY id ASC
        `;

      db.all(itemsQuery, pedidoIds, (err2, allItems) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const itemsMap = {};
        allItems.forEach(item => {
          if (!itemsMap[item.id_pedido]) {
            itemsMap[item.id_pedido] = [];
          }
          itemsMap[item.id_pedido].push(item);
        });

        const ahora = new Date();
        const resultado = pedidos
          .map(pedido => {
            const items = itemsMap[pedido.pedido_id] || [];
            if (items.length === 0) return null;

            const fechaPedido = new Date(pedido.fecha_pedido);
            const tiempoMinutos = Math.floor((ahora - fechaPedido) / 60000);

            return {
              mesa: {
                id: pedido.mesa_id,
                numero_mesa: pedido.numero_mesa,
                estado: pedido.mesa_estado
              },
              pedido_id: pedido.pedido_id,
              fecha_pedido: pedido.fecha_pedido,
              tiempo_minutos: tiempoMinutos,
              mesonero: {
                id: pedido.id_mesonero,
                nombre: pedido.mesonero_nombre || 'Mesonero'
              },
              items: items
            };
          })
          .filter(p => p !== null);

        res.json(resultado);
      });
    });
  });

  app.post('/api/cocina/mesas/:id/listo', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.serialize(() => {
      db.get(`
            SELECT p.id, p.id_mesonero, p.nombre_mesonero, m.numero_mesa 
            FROM pedidos p 
            JOIN mesas m ON m.id = p.id_mesa 
            WHERE p.id_mesa = ? AND p.estado = 'abierto'
        `, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Pedido no encontrado" });

        const numeroMesa = row.numero_mesa;

        db.run("UPDATE items_pedido SET estado = 'listo' WHERE id_pedido = ? AND estado = 'en_cocina'", [row.id], function (err) {
          if (err) return res.status(500).json({ error: err.message });
          db.run("UPDATE mesas SET estado = 'atendida' WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            io.emit('mesa_actualizada', { id: parseInt(id), estado: 'atendida' });
            io.emit('pedido_actualizado', { id_pedido: row.id, id_mesa: parseInt(id) });

            io.emit('pedido_listo', {
              numero_mesa: numeroMesa,
              mensaje: `El pedido de la mesa ${numeroMesa} está listo`
            });

            io.emit('mi_pedido_listo', {
              numero_mesa: numeroMesa,
              mensaje: `Tu pedido de la mesa ${numeroMesa} está listo`
            });

            res.json({ success: true });
          });
        });
      });
    });
  });
};
