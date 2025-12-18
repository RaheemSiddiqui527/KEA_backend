import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  getAllSeminars,
  getSeminarById,
  createSeminar,
  updateSeminar,
  deleteSeminar,
  registerForSeminar,
  unregisterFromSeminar,
  getCategoryStats
} from '../controllers/seminar.controller.js';

const router = express.Router();

// Public routes
router.get('/categories/stats', getCategoryStats);
router.get('/', getAllSeminars);
router.get('/:id', getSeminarById);

// Protected routes
router.post('/', auth, createSeminar);
router.put('/:id', auth, updateSeminar);
router.delete('/:id', auth, deleteSeminar);
router.post('/:id/register', auth, registerForSeminar);
router.post('/:id/unregister', auth, unregisterFromSeminar);

export default router;