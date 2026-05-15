module.exports = function (app, io, deps) {
  const { getDb } = deps;

  app.get('/api/reportes/ventas', (req, res) => {
    const db = getDb();
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date().toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    db.all(`
        SELECT 
            p.id,
            p.numero_mesa,
            p.nombre_mesonero,
            p.total,
            p.propina,
            p.metodo_pago,
            p.fecha_cierre
        FROM pedidos p
        WHERE p.estado = 'pagado' AND date(p.fecha_cierre) BETWEEN ? AND ?
        ORDER BY p.fecha_cierre DESC
    `, [fechaDesde, fechaHasta], (err, pedidos) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalVentas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
      const totalPropinas = pedidos.reduce((acc, p) => acc + (p.propina || 0), 0);

      const porMetodo = {};
      pedidos.forEach(p => {
        const metodo = p.metodo_pago || 'efectivo';
        if (!porMetodo[metodo]) porMetodo[metodo] = 0;
        porMetodo[metodo] += p.total || 0;
      });

      res.json({
        desde: fechaDesde,
        hasta: fechaHasta,
        pedidos,
        resumen: {
          total_ventas: totalVentas,
          total_propinas: totalPropinas,
          total_general: totalVentas + totalPropinas,
          cantidad_pedidos: pedidos.length,
          por_metodo: porMetodo
        }
      });
    });
  });

  app.get('/api/reportes/productos', (req, res) => {
    const db = getDb();
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date().toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    db.all(`
        SELECT 
            ip.nombre_producto,
            c.nombre as categoria,
            COUNT(*) as cantidad,
            SUM(ip.precio) as total
        FROM items_pedido ip
        JOIN pedidos p ON ip.id_pedido = p.id
        LEFT JOIN productos pr ON pr.nombre = ip.nombre_producto
        LEFT JOIN categorias c ON c.id = pr.id_categoria
        WHERE p.estado = 'pagado' AND date(p.fecha_cierre) BETWEEN ? AND ?
        GROUP BY ip.nombre_producto
        ORDER BY cantidad DESC
    `, [fechaDesde, fechaHasta], (err, productos) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalVendido = productos.reduce((acc, p) => acc + (p.total || 0), 0);

      res.json({
        desde: fechaDesde,
        hasta: fechaHasta,
        productos,
        resumen: {
          total_vendido: totalVendido,
          cantidad_productos: productos.length
        }
      });
    });
  });

  app.get('/api/reportes/completo', (req, res) => {
    const db = getDb();
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date().toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    let result = { desde: fechaDesde, hasta: fechaHasta };
    let pending = 3;
    let hasError = false;

    const respondError = (msg) => {
      if (hasError) return;
      hasError = true;
      res.status(500).json({ error: msg });
    };

    const checkDone = () => {
      if (--pending === 0 && !hasError) res.json(result);
    };

    db.all(`
      SELECT p.id, p.numero_mesa, p.nombre_mesonero, p.total, p.propina, p.metodo_pago, p.fecha_cierre
      FROM pedidos p
      WHERE p.estado = 'pagado' AND date(p.fecha_cierre) BETWEEN ? AND ?
      ORDER BY p.fecha_cierre DESC
    `, [fechaDesde, fechaHasta], (err, pedidos) => {
      if (err) return respondError(err.message);
      const totalVentas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
      const totalPropinas = pedidos.reduce((acc, p) => acc + (p.propina || 0), 0);
      const porMetodo = {};
      pedidos.forEach(p => {
        const metodo = p.metodo_pago || 'efectivo';
        porMetodo[metodo] = (porMetodo[metodo] || 0) + (p.total || 0);
      });
      result.ventas = { cantidad: pedidos.length, total_ventas: totalVentas, total_propinas: totalPropinas, total_general: totalVentas + totalPropinas, por_metodo: porMetodo };
      result.pedidos = pedidos;
      checkDone();
    });

    db.all(`
      SELECT ip.nombre_producto, c.nombre as categoria, COUNT(*) as cantidad, SUM(ip.precio) as total
      FROM items_pedido ip
      JOIN pedidos p ON ip.id_pedido = p.id
      LEFT JOIN productos pr ON pr.nombre = ip.nombre_producto
      LEFT JOIN categorias c ON c.id = pr.id_categoria
      WHERE p.estado = 'pagado' AND date(p.fecha_cierre) BETWEEN ? AND ?
      GROUP BY ip.nombre_producto ORDER BY cantidad DESC
    `, [fechaDesde, fechaHasta], (err, productos) => {
      if (err) return respondError(err.message);
      const totalVendido = productos.reduce((acc, p) => acc + (p.total || 0), 0);
      result.productos = { items: productos, total_vendido: totalVendido, cantidad_productos: productos.length };
      checkDone();
    });

    db.all(`
      SELECT nombre_mesonero, COUNT(*) as pedidos, COALESCE(SUM(total), 0) as ventas,
        COALESCE(SUM(propina), 0) as propinas, COUNT(DISTINCT numero_mesa) as mesas_atendidas
      FROM pedidos
      WHERE estado = 'pagado' AND nombre_mesonero IS NOT NULL AND date(fecha_cierre) BETWEEN ? AND ?
      GROUP BY nombre_mesonero ORDER BY ventas DESC
    `, [fechaDesde, fechaHasta], (err, mesoneros) => {
      if (err) return respondError(err.message);
      const totalVentas = mesoneros.reduce((acc, m) => acc + (m.ventas || 0), 0);
      const totalPropinas = mesoneros.reduce((acc, m) => acc + (m.propinas || 0), 0);
      result.mesoneros = { items: mesoneros, total_ventas: totalVentas, total_propinas: totalPropinas, total_general: totalVentas + totalPropinas, cantidad_mesoneros: mesoneros.length };
      checkDone();
    });
  });

  app.get('/api/reportes/mesoneros', (req, res) => {
    const db = getDb();
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date().toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    db.all(`
        SELECT 
            nombre_mesonero,
            COUNT(*) as pedidos,
            COALESCE(SUM(total), 0) as ventas,
            COALESCE(SUM(propina), 0) as propinas,
            COUNT(DISTINCT numero_mesa) as mesas_atendidas
        FROM pedidos
        WHERE estado = 'pagado' AND nombre_mesonero IS NOT NULL
        AND date(fecha_cierre) BETWEEN ? AND ?
        GROUP BY nombre_mesonero
        ORDER BY ventas DESC
    `, [fechaDesde, fechaHasta], (err, mesoneros) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalVentas = mesoneros.reduce((acc, m) => acc + (m.ventas || 0), 0);
      const totalPropinas = mesoneros.reduce((acc, m) => acc + (m.propinas || 0), 0);

      res.json({
        desde: fechaDesde,
        hasta: fechaHasta,
        mesoneros,
        resumen: {
          total_ventas: totalVentas,
          total_propinas: totalPropinas,
          total_general: totalVentas + totalPropinas,
          cantidad_mesoneros: mesoneros.length
        }
      });
    });
  });
};
