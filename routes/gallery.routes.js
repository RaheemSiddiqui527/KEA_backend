import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  listGallery,
  getGalleryItem,
  uploadGalleryItem,
  likeGalleryItem,
  commentGalleryItem,
  deleteGalleryItem,
  getCategoryStats
} from '../controllers/gallery.controller.js';

const router = express.Router();

// Public routes
router.get('/categories/stats', getCategoryStats);
router.get('/', listGallery);
router.get('/:id', getGalleryItem);

// Protected routes
router.post('/', auth, uploadGalleryItem);
router.post('/:id/like', auth, likeGalleryItem);
router.post('/:id/comment', auth, commentGalleryItem);
router.delete('/:id', auth, deleteGalleryItem);

export default router;