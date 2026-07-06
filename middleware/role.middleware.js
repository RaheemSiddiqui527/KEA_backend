export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  
  // Allow superadmin to access admin routes
  if (role === 'admin' && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  
  if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
};
