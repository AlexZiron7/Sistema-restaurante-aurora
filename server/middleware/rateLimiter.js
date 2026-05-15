const requests = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!requests.has(ip)) {
    requests.set(ip, []);
  }

  const timestamps = requests.get(ip).filter(ts => now - ts < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' });
  }

  timestamps.push(now);
  requests.set(ip, timestamps);
  next();
}

module.exports = { rateLimiter };
