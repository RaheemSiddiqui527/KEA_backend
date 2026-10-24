import express from 'express';
import { auth, isAdmin } from '../middleware/auth.middleware.js';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
} from '../controllers/resourceCategory.controller.js';

const router = express.Router();

// Public route to get all categories
router.get('/', getAllCategories);

// Admin-only routes for managing categories
router.post('/', auth, isAdmin, createCategory);
router.put('/:id', auth, isAdmin, updateCategory);
router.delete('/:id', auth, isAdmin, deleteCategory);

// Subcategory / nested folder management
router.post('/:id/subcategories', auth, isAdmin, addSubcategory);
router.delete('/:id/subcategories/:subName', auth, isAdmin, deleteSubcategory);

export default router;

