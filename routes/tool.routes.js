import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
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

// Public routes
router.get('/categories/stats', getCategoryStats);
router.get('/', getAllTools);
router.get('/:id', getToolById);
router.post('/:id/download', incrementDownloads);

// Protected routes
router.post('/', auth, createTool);
router.put('/:id', auth, updateTool);
router.delete('/:id', auth, deleteTool);

export default router;