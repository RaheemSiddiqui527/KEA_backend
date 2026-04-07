import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.middleware.js';
import {
  getAllTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  getCategoryStats,
  incrementDownloads
} from '../controllers/tool.controller.js';

const router = express.Router();

// Public routes (with optional auth for admin view)
router.get('/categories/stats', optionalAuth, getCategoryStats);
router.get('/', optionalAuth, getAllTools);
router.get('/:id', optionalAuth, getToolById);
router.post('/:id/download', incrementDownloads);

// Protected routes
router.post('/', auth, createTool);
router.put('/:id', auth, updateTool);
router.delete('/:id', auth, deleteTool);

export default router;