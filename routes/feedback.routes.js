import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  submitFeedback,
  getUserFeedback,
  getFeedback,
  deleteFeedback,
  getFeedbackStats
} from '../controllers/feedback.controller.js';

const router = express.Router();

// All routes require authentication
router.post('/', auth, submitFeedback);
router.get('/', auth, getUserFeedback);
router.get('/stats', auth, getFeedbackStats);
router.get('/:id', auth, getFeedback);
router.delete('/:id', auth, deleteFeedback);

export default router;