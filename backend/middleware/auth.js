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

/** Limita una ruta a ciertos roles (se usa después de requireAuth). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) return res.status(403).json({ error: 'No tienes permiso para esta sección.' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
