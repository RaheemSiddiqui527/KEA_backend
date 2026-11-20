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

// All mentor routes require authentication
router.use(auth);

// Specific routes (MUST come before /:id)
router.get('/stats', getMentorStats);
router.get('/me/profile', getMyMentorProfile);
router.get('/admin/all', getAllMentorsAdmin);

// Collection routes
router.get('/', listMentors);
router.post('/', createMentor);

// Dynamic /:id routes
router.get('/:id', getMentor);
router.put('/:id', updateMentor);
router.post('/:id/book', bookSession);
router.post('/:id/approve', approveMentor);
router.post('/:id/reject', rejectMentor);

export default router;