import jwt from 'jsonwebtoken';

// Verifies JWT and attaches decoded user to req.user
export const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer')) {
    try {
      const token = auth.split(' ')[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      return next();
    } catch {
      return res.status(401).json({ message: 'Not authorized, token invalid.' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token.' });
};

// Role-based guard factory
// Usage: requireRole('ndrf', 'fire')
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated.' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}.` });
  next();
};
