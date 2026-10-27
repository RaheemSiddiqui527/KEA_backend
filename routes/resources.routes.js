import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

import {
  getAllResources,
  getResourceById,
  createResource,
  uploadResource,
  updateResource,
  deleteResource,
  getCategoryStats,
  viewResource,
  downloadResource,
} from '../controllers/resource.controller.js';

const router = express.Router();

// ================= STATS & LISTING =================
router.get('/categories/stats', optionalAuth, getCategoryStats);
router.get('/', optionalAuth, getAllResources);

// ================= ADMIN ALIASES (MUST BE BEFORE :id) =================
router.post('/admin/upload', auth, upload.any(), uploadResource);
router.post('/admin', auth, createResource);
router.put('/admin/:id', auth, upload.single('file'), updateResource);
router.delete('/admin/:id', auth, deleteResource);

// ================= VIEW & DOWNLOAD (MUST BE BEFORE :id) =================
router.get('/:id/view', viewResource);
router.get('/:id/download', downloadResource);

// ================= CRUD =================
router.get('/:id', auth, getResourceById);
router.post('/', auth, createResource); // external links
router.post('/upload', auth, upload.any(), uploadResource); // files upload (supports single or multiple)
router.put('/:id', auth, upload.single('file'), updateResource);
router.delete('/:id', auth, deleteResource);

export default router;
