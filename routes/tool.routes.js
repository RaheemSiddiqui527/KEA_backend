import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.middleware.js';
import toolUpload from '../middleware/toolUpload.middleware.js';
import {
  getAllTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  getCategoryStats,
  incrementDownloads,
  uploadToolFile
} from '../controllers/tool.controller.js';

const router = express.Router();

// Public routes (with optional auth for admin view)
router.get('/categories/stats', optionalAuth, getCategoryStats);
router.get('/', optionalAuth, getAllTools);
router.get('/:id', optionalAuth, getToolById);
router.post('/:id/download', incrementDownloads);

// Protected routes
router.post('/', auth, createTool);
router.post('/upload-file', auth, toolUpload.single('file'), uploadToolFile);
router.put('/:id', auth, updateTool);
router.delete('/:id', auth, deleteTool);

export default router;