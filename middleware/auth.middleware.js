import jwt from 'jsonwebtoken';
import User from '../models/user.models.js';

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'No token provided' });
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Optional auth (doesn't fail if token missing)
export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return next();
    
    const token = header.split(' ')[1];
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (user) req.user = user;
    
    next();
  } catch (err) {
    // Just move on if token invalid
    next();
  }
};
// middleware/admin.middleware.js
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin access required. You do not have permission to perform this action.' 
      });
    }

    next();
  } catch (err) {
    console.error('❌ Error in isAdmin middleware:', err);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Optional: More granular moderator check
export const isModerator = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Allow both admin and moderator roles
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Moderator access required' 
      });
    }

    next();
  } catch (err) {
    console.error('❌ Error in isModerator middleware:', err);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};