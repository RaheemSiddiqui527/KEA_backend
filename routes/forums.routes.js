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
import { approveThread } from '../controllers/forums.controller.js';
import { rejectThread } from '../controllers/forums.controller.js';
import { editThread } from '../controllers/forums.controller.js';

const router = express.Router();

// IMPORTANT: Specific routes BEFORE parameterized routes
router.get('/categories/stats', auth, getCategoryStats);
router.get('/', auth, listThreads);
router.post('/', auth, createThread);

// These must come before /:id
router.patch('/:id/approve', auth, approveThread);
router.patch('/:id/reject', auth, rejectThread);
router.post('/:id/reply', auth, replyThread);
router.post('/:id/replies/:replyId/like', auth, likeReply);
router.patch('/:id/pin', auth, togglePinThread);
router.patch('/:id/lock', auth, toggleLockThread);


router.put('/:id', auth, editThread);


// This MUST be last
router.get('/:id', auth, getThread);
router.delete('/:id', auth, deleteThread);

export default router;