import express from 'express';
import { adminAuth } from '../middleware/adminAuth.middleware.js';
import {
  getPublicPage,
  getAllPagesAdmin,
  getAdminPageDetails,
  savePageDraft,
  publishPage,
  restorePageVersion,
  createPage,
  deletePage
} from '../controllers/cmsPage.controller.js';

const router = express.Router();

// ================= PUBLIC =================
router.get('/public/:slug', getPublicPage);

// ================= ADMIN PROTECTED =================
router.get('/admin/list', adminAuth, getAllPagesAdmin);
router.get('/admin/:id', adminAuth, getAdminPageDetails);
router.post('/admin', adminAuth, createPage);
router.patch('/admin/:id/draft', adminAuth, savePageDraft);
router.patch('/admin/:id/publish', adminAuth, publishPage);
router.post('/admin/:id/restore/:versionIndex', adminAuth, restorePageVersion);
router.delete('/admin/:id', adminAuth, deletePage);

export default router;
