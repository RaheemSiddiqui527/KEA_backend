// middleware/admin.middleware.js
export const adminOnly = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};
