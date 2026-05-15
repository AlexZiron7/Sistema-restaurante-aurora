function validateId(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  req.params.id = id;
  next();
}

function validateDateRange(desde, hasta) {
  if (desde && isNaN(Date.parse(desde))) return false;
  if (hasta && isNaN(Date.parse(hasta))) return false;
  return true;
}

module.exports = { validateId, validateDateRange };
