import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
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

// Public routes
router.get('/', listMentors); // Only shows approved mentors
router.get('/stats', getMentorStats);
router.get('/:id', getMentor);

// Protected user routes
router.post('/', auth, createMentor); // Submit for approval
router.get('/me/profile', auth, getMyMentorProfile); // Get own profile
router.put('/:id', auth, updateMentor); // Update (requires re-approval)
router.post('/:id/book', auth, bookSession);

// Admin only routes
router.get('/admin/all', auth, getAllMentorsAdmin); // All mentors including pending
router.post('/:id/approve', auth, approveMentor); // Approve mentor
router.post('/:id/reject', auth, rejectMentor); // Reject mentor

export default router;