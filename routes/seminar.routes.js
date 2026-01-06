import express from 'express';
import { auth, isAdmin } from '../middleware/auth.middleware.js';
import {
  getAllSeminars,
  getSeminarById,
  createSeminar,
  updateSeminar,
  deleteSeminar,
  bulkDeleteSeminars,
  registerForSeminar,
  unregisterFromSeminar,
  getCategoryStats,
  getStats
} from '../controllers/seminar.controller.js';

const router = express.Router();

// Public routes (IMPORTANT: Put specific routes BEFORE dynamic routes)
router.get('/categories/stats', getCategoryStats);
router.get('/stats', getStats); // NEW: Optimized stats endpoint

// Protected admin routes (IMPORTANT: /bulk MUST come BEFORE /:id)
router.delete('/bulk', auth, isAdmin, bulkDeleteSeminars); // NEW: Bulk delete

// Public routes with dynamic params
router.get('/', getAllSeminars);
router.get('/:id', getSeminarById);

// Protected routes (admin only)
router.post('/', auth, isAdmin, createSeminar);
router.put('/:id', auth, isAdmin, updateSeminar);
router.delete('/:id', auth, isAdmin, deleteSeminar);

// Protected routes (authenticated users)
router.post('/:id/register', auth, registerForSeminar);
router.post('/:id/unregister', auth, unregisterFromSeminar);

export default router;