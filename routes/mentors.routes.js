import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.middleware.js';
import {
  listMentors,
  getMentor,
  createMentor,
  updateMentor,
  bookSession,
  getMentorStats,
  getAllMentorsAdmin,
  approveMentor,
  rejectMentor,
  getMyMentorProfile
} from '../controllers/mentors.controller.js';

const router = express.Router();

// Specific routes (MUST come before /:id)
router.get('/stats', auth, getMentorStats);
router.get('/me/profile', auth, getMyMentorProfile);
router.get('/admin/all', auth, getAllMentorsAdmin);

// Collection routes
router.get('/', optionalAuth, listMentors);
router.post('/', auth, createMentor);

// Dynamic /:id routes
router.get('/:id', optionalAuth, getMentor);
router.put('/:id', auth, updateMentor);
router.post('/:id/book', auth, bookSession);
router.post('/:id/approve', auth, approveMentor);
router.post('/:id/reject', auth, rejectMentor);

export default router;