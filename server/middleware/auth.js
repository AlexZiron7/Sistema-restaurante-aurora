const crypto = require('crypto');

const sessions = new Map();

const SESSION_TTL = 24 * 60 * 60 * 1000;

function crearToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const session = {
    userId: user.id,
    username: user.usuario,
    nombre: user.nombre,
    rol: user.rol,
    createdAt: Date.now(),
  };
  sessions.set(token, session);
  return token;
}

function destruirToken(token) {
  sessions.delete(token);
}

function authMiddleware(req, res, next) {
  const publicPaths = ['/ping', '/auth/login', '/license-status', '/license-status/recheck'];
  const publicGetPaths = ['/config', '/tasa-bcv', '/mesas'];
  const requestPath = req.path || req.url || '';
  if (publicPaths.some(p => requestPath.endsWith(p))) return next();
  if (req.method === 'GET' && publicGetPaths.some(p => requestPath.endsWith(p))) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = authHeader.slice(7);
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }

  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Sesión expirada' });
  }

  req.user = session;
  req.token = token;
  next();
}

function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRol, crearToken, destruirToken };
