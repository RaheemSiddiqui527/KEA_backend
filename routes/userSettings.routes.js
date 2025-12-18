import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  getUserSettings,
  updateAccountSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  changePassword,
  deleteAccount
} from '../controllers/userSettings.controller.js';

const router = express.Router();

// All routes require authentication
router.get('/', auth, getUserSettings);
router.put('/account', auth, updateAccountSettings);
router.put('/notifications', auth, updateNotificationSettings);
router.put('/privacy', auth, updatePrivacySettings);
router.put('/password', auth, changePassword);
router.delete('/account', auth, deleteAccount);

export default router;