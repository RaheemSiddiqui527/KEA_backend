import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js'; // ✅ WASABI MULTER

import {
  getAllResources,
  getResourceById,
  createResource,
  uploadResource,
  updateResource,
  deleteResource,
  getCategoryStats,
  viewResource,
} from '../controllers/resource.controller.js';

const router = express.Router();

// ================= MEMBERS ONLY =================
router.get('/categories/stats', auth, getCategoryStats);
router.get('/', auth, getAllResources);

// ================= VIEW (MUST BE BEFORE :id) =================
router.get('/:id/view',  viewResource);

// ================= CRUD =================
router.get('/:id', auth, getResourceById);
router.post('/', auth, createResource); // external links only
router.post('/upload', auth, upload.single('file'), uploadResource); // 🔥 Wasabi
router.put('/:id', auth, updateResource);
router.delete('/:id', auth, deleteResource);

export default router;
