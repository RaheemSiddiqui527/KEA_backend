import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  getAdminNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
} from '../controllers/notification.controller.js';

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

router.get('/', getAdminNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

export default router;