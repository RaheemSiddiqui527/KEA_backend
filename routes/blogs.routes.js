import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { 
  createBlog, 
  listPublished, 
  getBlog, 
  addComment, 
  getComments,
  likeBlog,
  getCategoryStats   
} from '../controllers/blogs.controller.js';

const router = express.Router();

// IMPORTANT: Specific routes MUST come before parameterized routes
router.get('/categories/stats', getCategoryStats); // ✅ MUST BE FIRST

// List and create
router.get('/', listPublished);
router.post('/', auth, createBlog);

// Comments and likes (specific paths before :id)
router.post('/:id/comments', auth, addComment);
router.get('/:id/comments', getComments);
router.post('/:id/like', auth, likeBlog);

// Get single blog (MUST BE LAST)
router.get('/:id', getBlog); // ✅ MUST BE LAST

export default router;