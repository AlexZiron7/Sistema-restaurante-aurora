module.exports = function (app, io, deps) {
  const { getDb, setModoDemo, bcrypt, crearToken } = deps;

  app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/auth/login', (req, res) => {
    const { usuario, pin } = req.body;

    if (!usuario || !pin) {
      return res.status(400).json({ success: false, message: 'Usuario y PIN son requeridos' });
    }

    if (typeof usuario !== 'string' || typeof pin !== 'string') {
      return res.status(400).json({ success: false, message: 'Formato inválido' });
    }

    const isDemo = usuario.toLowerCase() === 'demo';
    const loginUser = isDemo ? 'dueno' : usuario;

    if (isDemo) {
      setModoDemo(true);
    } else {
      setModoDemo(false);
    }
    const db = getDb();

    db.get("SELECT * FROM usuarios WHERE usuario = ? AND estado_activo = 1",
      [loginUser], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ success: false, message: "Usuario o PIN incorrecto" });

        const isHash = row.pin_acceso && (row.pin_acceso.startsWith('$2a$') || row.pin_acceso.startsWith('$2b$'));

        function loginSuccess(row) {
          const { pin_acceso, ...user } = row;
          const token = crearToken(row);
          res.json({ success: true, user, token, modo_demo: isDemo });
        }

        if (isHash) {
          bcrypt.compare(pin, row.pin_acceso, (err, match) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!match) return res.status(401).json({ success: false, message: "Usuario o PIN incorrecto" });
            loginSuccess(row);
          });
        } else {
          bcrypt.compare(pin, row.pin_acceso, (err, match) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!match) return res.status(401).json({ success: false, message: "Usuario o PIN incorrecto" });
            bcrypt.hash(pin, 10, (err, hash) => {
              if (!err) {
                db.run("UPDATE usuarios SET pin_acceso = ? WHERE id = ?", [hash, row.id]);
              }
            });
            loginSuccess(row);
          });
        }
      });
  });

  app.post('/api/auth/logout', (req, res) => {
    const { destruirToken } = deps;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      destruirToken(authHeader.slice(7));
    }
    res.json({ success: true });
  });
};
