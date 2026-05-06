const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'guilochouse_secret_2024';

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.user = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

function authenticateAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (!req.user.is_admin) return res.status(403).json({ error: 'Accès refusé' });
    next();
  });
}

module.exports = { authenticate, authenticateAdmin };
