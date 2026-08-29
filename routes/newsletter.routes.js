import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  subscribe,
  unsubscribe,
  getSubscribersAdmin,
  toggleSubscriberStatus,
  deleteSubscriber,
  sendCampaignBroadcast,
  sendTestCampaign
} from '../controllers/newsletter.controller.js';

const router = express.Router();

// ================= PUBLIC ROUTES =================
router.post('/subscribe', subscribe);
router.get('/unsubscribe', unsubscribe);

// ================= ADMIN PROTECTED ROUTES =================
router.get('/admin/subscribers', auth, getSubscribersAdmin);
router.patch('/admin/subscribers/:id/status', auth, toggleSubscriberStatus);
router.delete('/admin/subscribers/:id', auth, deleteSubscriber);
router.post('/admin/broadcast', auth, sendCampaignBroadcast);
router.post('/admin/test', auth, sendTestCampaign);

export default router;
