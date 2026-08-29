import express from 'express';
import { auth, isAdmin } from '../middleware/auth.middleware.js';
import {
  getActiveDisciplines,
  getAllDisciplines,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  findOrCreateDiscipline,
} from '../controllers/discipline.controller.js';

const router = express.Router();

// Public route to get active disciplines
router.get('/', getActiveDisciplines);

// Find or create discipline (used by users when they type 'Other')
router.post('/find-or-create', findOrCreateDiscipline);

// Admin-only routes for managing disciplines
router.get('/admin', auth, isAdmin, getAllDisciplines);
router.post('/', auth, isAdmin, createDiscipline);
router.put('/:id', auth, isAdmin, updateDiscipline);
router.delete('/:id', auth, isAdmin, deleteDiscipline);

export default router;
