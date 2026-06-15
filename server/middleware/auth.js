const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để tiếp tục.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = {
      id: Number(payload.sub),
      email: payload.email
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
  }
}

module.exports = {
  requireAuth
};

