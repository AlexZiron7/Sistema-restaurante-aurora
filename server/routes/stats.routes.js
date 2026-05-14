module.exports = function (app, io, deps) {
  const { getDb } = deps;

  app.get('/api/stats/hoy', (req, res) => {
    const db = getDb();
    const hoy = new Date().toISOString().split('T')[0];
    db.all(`
        SELECT 
            COUNT(*) as total_pedidos,
            COALESCE(SUM(total + propina), 0) as ingresos_totales,
            COALESCE(SUM(total), 0) as ingresos_sin_propina,
            COALESCE(SUM(propina), 0) as total_propinas,
            COUNT(DISTINCT numero_mesa) as mesas_atendidas
        FROM pedidos
        WHERE estado = 'pagado' AND date(fecha_cierre) = ?
    `, [hoy], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(`
            SELECT metodo_pago, COUNT(*) as cantidad, COALESCE(SUM(total + propina), 0) as monto
            FROM pedidos
            WHERE estado = 'pagado' AND date(fecha_cierre) = ?
            GROUP BY metodo_pago
        `, [hoy], (err2, metodos) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ...rows[0], metodos_pago: metodos });
      });
    });
  });

  app.get('/api/stats/semana', (req, res) => {
    const db = getDb();
    db.all(`
        SELECT 
            date(fecha_cierre) as fecha,
            COUNT(*) as pedidos,
            COALESCE(SUM(total + propina), 0) as ingresos
        FROM pedidos
        WHERE estado = 'pagado' AND fecha_cierre >= date('now', '-6 days')
        GROUP BY date(fecha_cierre)
        ORDER BY fecha ASC
    `, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.get('/api/stats/mesoneros', (req, res) => {
    const db = getDb();
    const hoy = new Date().toISOString().split('T')[0];
    db.all(`
        SELECT 
            nombre_mesonero,
            COUNT(*) as pedidos,
            COALESCE(SUM(total + propina), 0) as ventas,
            COALESCE(SUM(propina), 0) as propinas
        FROM pedidos
        WHERE estado = 'pagado' AND date(fecha_cierre) = ?
        GROUP BY nombre_mesonero
        ORDER BY ventas DESC
    `, [hoy], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.get('/api/stats/productos', (req, res) => {
    const db = getDb();
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date().toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    db.all(`
        SELECT 
            ip.nombre_producto,
            COUNT(*) as cantidad_vendida,
            COALESCE(SUM(ip.precio), 0) as ingresos
        FROM items_pedido ip
        JOIN pedidos p ON ip.id_pedido = p.id
        WHERE p.estado = 'pagado' AND date(p.fecha_cierre) BETWEEN ? AND ?
        GROUP BY ip.nombre_producto
        ORDER BY cantidad_vendida DESC
        LIMIT 10
    `, [fechaDesde, fechaHasta], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
};
