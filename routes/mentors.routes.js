import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  listMentors,
  getMentor,
  createMentor,
  updateMentor,
  bookSession,
  getMentorStats
} from '../controllers/mentors.controller.js';

const router = express.Router();

// Public routes
router.get('/', listMentors);
router.get('/stats', getMentorStats);
router.get('/:id', getMentor);

// Protected routes
router.post('/', auth, createMentor);
router.put('/:id', auth, updateMentor);
router.post('/:id/book', auth, bookSession);

export default router;