const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload; // { id, role, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin' || req.user.admin_status !== 'approved') {
    return res.status(403).json({ error: 'Approved admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
