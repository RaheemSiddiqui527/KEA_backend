import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';

import {
  createThread,
  listThreads,
  getThread,
  replyThread,
  likeReply,
  getCategoryStats,
  deleteThread,
  togglePinThread,
  toggleLockThread,
  approveThread,
  editThread
} from '../controllers/forums.controller.js';

const router = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */

// Category stats (approved only for public)
router.get('/categories/stats', getCategoryStats);

// List threads
router.get('/', listThreads);

// Get single thread
router.get('/:id', getThread);

/* =========================
   AUTHENTICATED USER ROUTES
========================= */

// Create thread (pending approval)
router.post('/', auth, createThread);

// Reply to approved thread
router.post('/:id/reply', auth, replyThread);

// Like / unlike reply
router.post('/:id/replies/:replyId/like', auth, likeReply);

/* =========================
   ADMIN ROUTES
========================= */

// Approve thread
router.patch('/:id/approve', auth, adminOnly, approveThread);

// Edit thread
router.patch('/:id', auth, adminOnly, editThread);

// Delete thread
router.delete('/:id', auth, adminOnly, deleteThread);

// Pin / Unpin
router.patch('/:id/pin', auth, adminOnly, togglePinThread);

// Lock / Unlock
router.patch('/:id/lock', auth, adminOnly, toggleLockThread);

export default router;
