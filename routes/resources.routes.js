import express from 'express';
import multer from 'multer';
import path from 'path';
import { auth } from '../middleware/auth.middleware.js';

import {
  getAllResources,
  getResourceById,
  createResource,
  uploadResource,
  updateResource,
  deleteResource,
  getCategoryStats
} from '../controllers/resource.controller.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /pdf|docx|doc|mp4|avi|mov|jpg|jpeg|png|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  ext && mime
    ? cb(null, true)
    : cb(new Error('Invalid file type'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

// IMPORTANT: Category stats MUST be before /:id route
router.get('/categories/stats', getCategoryStats);
router.get('/', getAllResources);
router.post('/', auth, createResource);
router.post('/upload', auth, upload.single('file'), uploadResource);
router.get('/:id', getResourceById);
router.put('/:id', auth, updateResource);
router.delete('/:id', auth, deleteResource);

export default router;