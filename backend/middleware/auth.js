const jwt = require('jsonwebtoken');

/** Exige un token válido (cabecera Authorization: Bearer <token>) y expone req.user. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  }
}

module.exports = { requireAuth };
