import express from 'express';
import { auth, isAdmin } from '../middleware/auth.middleware.js';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/resourceCategory.controller.js';

const router = express.Router();

// Public route to get all categories
router.get('/', getAllCategories);

// Admin-only routes for managing categories
router.post('/', auth, isAdmin, createCategory);
router.put('/:id', auth, isAdmin, updateCategory);
router.delete('/:id', auth, isAdmin, deleteCategory);

export default router;
