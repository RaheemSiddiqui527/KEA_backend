import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
 listGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  createPost,
  likePost,
  commentPost,
  getCategoryStats,
  getPendingRequests,
  approveJoinRequest,
  rejectJoinRequest
} from '../controllers/groups.controller.js';

const router = express.Router();

// Public routes
router.get('/categories/stats', getCategoryStats);
router.get('/', listGroups);
router.get('/:id', getGroup);
router.get('/:id', auth, getGroup);

// Protected routes
router.post('/', auth, createGroup);
router.post('/:id/join', auth, joinGroup);
router.post('/:id/leave', auth, leaveGroup);
router.get('/:id/requests', auth, getPendingRequests);
router.post('/:id/requests/:userId/approve', auth, approveJoinRequest);
router.post('/:id/requests/:userId/reject', auth, rejectJoinRequest);
router.post('/:id/posts', auth, createPost);
router.post('/:id/posts/:postId/like', auth, likePost);
router.post('/:id/posts/:postId/comment', auth, commentPost);

export default router;