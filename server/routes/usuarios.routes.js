module.exports = function (app, io, deps) {
  const { getDb, bcrypt } = deps;

  app.get('/api/usuarios', (req, res) => {
    const db = getDb();
    db.all("SELECT id, usuario, nombre, rol, estado_activo, fecha_creacion FROM usuarios ORDER BY rol, nombre", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      rows.forEach(row => row.pin_acceso = '****');
      res.json(rows);
    });
  });

  app.get('/api/usuarios/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.get("SELECT id, usuario, nombre, rol FROM usuarios WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(row);
    });
  });

  app.post('/api/usuarios', (req, res) => {
    const db = getDb();
    const { usuario, pin, nombre, rol } = req.body;

    if (!usuario || !pin || !nombre || !rol) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    const rolesValidos = ['admin', 'gerente', 'cajero', 'mesonero', 'cocina'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ success: false, message: 'Rol no válido' });
    }

    bcrypt.hash(pin, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)",
        [usuario, hash, nombre, rol], function (err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(400).json({ success: false, message: 'El usuario ya existe' });
            }
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, id: this.lastID });
        });
    });
  });

  app.put('/api/usuarios/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { usuario, pin, nombre, rol, estado_activo } = req.body;

    let query = "UPDATE usuarios SET ";
    let params = [];
    let updates = [];

    if (usuario) { updates.push("usuario = ?"); params.push(usuario); }
    if (nombre) { updates.push("nombre = ?"); params.push(nombre); }
    if (rol) { updates.push("rol = ?"); params.push(rol); }
    if (estado_activo !== undefined) { updates.push("estado_activo = ?"); params.push(estado_activo ? 1 : 0); }

    if (updates.length === 0 && !pin) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    function doUpdate() {
      query += updates.join(", ") + " WHERE id = ?";
      params.push(id);
      db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    }

    if (pin && pin !== '****') {
      bcrypt.hash(pin, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err.message });
        updates.push("pin_acceso = ?");
        params.push(hash);
        doUpdate();
      });
    } else {
      doUpdate();
    }
  });

  app.delete('/api/usuarios/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;

    db.run("UPDATE usuarios SET estado_activo = 0 WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  app.get('/api/mesoneros', (req, res) => {
    const db = getDb();
    db.all(`
        SELECT id, usuario, nombre, rol, estado_activo
        FROM usuarios 
        WHERE rol = 'mesonero' AND estado_activo = 1
        ORDER BY nombre
    `, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.get('/api/mesoneros/:id/historial', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date().toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    db.get(`
        SELECT nombre FROM usuarios WHERE id = ?
    `, [id], (err, usuario) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!usuario) return res.status(404).json({ error: 'Mesonero no encontrado' });

      const nombreMesonero = usuario.nombre;

      db.get(`
            SELECT 
                COUNT(*) as pedidos,
                COALESCE(SUM(total), 0) as ventas,
                COALESCE(SUM(propina), 0) as propinas,
                COUNT(DISTINCT numero_mesa) as mesas_atendidas
            FROM pedidos
            WHERE nombre_mesonero = ? AND estado = 'pagado' 
            AND date(fecha_cierre) BETWEEN ? AND ?
        `, [nombreMesonero, fechaDesde, fechaHasta], (err2, stats) => {
        if (err2) return res.status(500).json({ error: err2.message });

        db.all(`
                SELECT 
                    p.*,
                    (SELECT GROUP_CONCAT(ip.nombre_producto, ', ') FROM items_pedido ip WHERE ip.id_pedido = p.id) as items_resumen
                FROM pedidos p
                WHERE p.nombre_mesonero = ? AND p.estado = 'pagado'
                AND date(p.fecha_cierre) BETWEEN ? AND ?
                ORDER BY p.fecha_cierre DESC
            `, [nombreMesonero, fechaDesde, fechaHasta], (err3, pedidos) => {
          if (err3) return res.status(500).json({ error: err3.message });

          res.json({
            mesonero: nombreMesonero,
            stats,
            pedidos
          });
        });
      });
    });
  });

  app.get('/api/mesoneros/mi-historial', (req, res) => {
    const db = getDb();
    const { id_usuario } = req.query;
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date().toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    if (!id_usuario) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }

    db.get(`
        SELECT nombre FROM usuarios WHERE id = ?
    `, [id_usuario], (err, usuario) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

      const nombreMesonero = usuario.nombre;

      db.get(`
            SELECT 
                COUNT(*) as pedidos,
                COALESCE(SUM(total), 0) as ventas,
                COALESCE(SUM(propina), 0) as propinas,
                COUNT(DISTINCT numero_mesa) as mesas_atendidas
            FROM pedidos
            WHERE nombre_mesonero = ? AND estado = 'pagado' 
            AND date(fecha_cierre) BETWEEN ? AND ?
        `, [nombreMesonero, fechaDesde, fechaHasta], (err2, stats) => {
        if (err2) return res.status(500).json({ error: err2.message });

        db.all(`
                SELECT 
                    p.*,
                    (SELECT GROUP_CONCAT(ip.nombre_producto, ', ') FROM items_pedido ip WHERE ip.id_pedido = p.id) as items_resumen
                FROM pedidos p
                WHERE p.nombre_mesonero = ? AND p.estado = 'pagado'
                AND date(p.fecha_cierre) BETWEEN ? AND ?
                ORDER BY p.fecha_cierre DESC
            `, [nombreMesonero, fechaDesde, fechaHasta], (err3, pedidos) => {
          if (err3) return res.status(500).json({ error: err3.message });

          res.json({
            mesonero: nombreMesonero,
            stats,
            pedidos
          });
        });
      });
    });
  });
};
