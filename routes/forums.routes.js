import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { 
  createThread, 
  listThreads, 
  getThread, 
  replyThread,
  likeReply,
  getCategoryStats,
  deleteThread,
  togglePinThread,
  toggleLockThread
} from '../controllers/forums.controller.js';

const router = express.Router();

// IMPORTANT: Specific routes BEFORE parameterized routes
router.get('/categories/stats', getCategoryStats);
router.get('/', listThreads);
router.post('/', auth, createThread);

// These must come before /:id
router.post('/:id/reply', auth, replyThread);
router.post('/:id/replies/:replyId/like', auth, likeReply);
router.patch('/:id/pin', auth, togglePinThread);
router.patch('/:id/lock', auth, toggleLockThread);

// This MUST be last
router.get('/:id', getThread);
router.delete('/:id', auth, deleteThread);

export default router;