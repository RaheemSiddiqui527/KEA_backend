import express from 'express';
import rateLimit from 'express-rate-limit';
import AdminController, { adminGetAllResources, adminGetStats, approveResource, rejectResource } from '../controllers/admin.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { deleteResource, getResourceById, uploadResource, createResource, updateResource, downloadResource } from '../controllers/resource.controller.js';
import upload from '../middleware/upload.middleware.js';
import { sendBulkEmail, getEmailLogs } from '../controllers/communications.controller.js';

const router = express.Router();

// =====================
// RATE LIMITERS
// =====================

// Standard rate limiter for admin GET requests
const adminReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1500 : 10000,
  message: 'Too many requests from this admin account, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Moderate rate limiter for admin write operations
const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 3000,
  message: 'Too many write operations, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for sensitive operations - 20 requests per 15 minutes
const adminSensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many sensitive operations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiter for critical operations - 5 requests per 15 minutes
const adminCriticalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Critical operation limit reached, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================
// MIDDLEWARE
// =====================

router.use(auth);
router.use(requireRole('admin'));

// =====================
// DASHBOARD (Read Operations)
// =====================

router.get('/dashboard', adminReadLimiter, AdminController.dashboardStats);
router.get('/stats', adminReadLimiter, AdminController.getAdminStats);
router.get('/analytics', adminReadLimiter, AdminController.getAnalyticsData);

// =====================
// MEMBERS ROUTES
// =====================

// Read operations
router.get('/members', adminReadLimiter, AdminController.getAllMembers);
router.get('/members/pending', adminReadLimiter, AdminController.pendingMembers);
router.get('/members/:id', adminReadLimiter, AdminController.getMemberById);

// Write operations (approval/rejection/reactivation/deletion)
router.patch('/members/:id/approve', adminWriteLimiter, AdminController.approveMember);
router.patch('/members/:id/reject', adminWriteLimiter, AdminController.rejectMember);
router.patch('/members/:id/reactivate', adminWriteLimiter, AdminController.reactivateMember);
router.delete('/members/:id', adminWriteLimiter, AdminController.deleteMember);

// =====================
// JOBS ROUTES
// =====================

// Read operations
router.get('/jobs', adminReadLimiter, AdminController.getAllJobs);
router.get('/jobs/pending', adminReadLimiter, AdminController.pendingJobs);
router.get('/jobs/applications', adminReadLimiter, AdminController.getJobApplications);
router.get('/jobs/:id', adminReadLimiter, AdminController.getJobById);

// Write operations
router.post('/jobs/approve/:id', adminWriteLimiter, AdminController.approveJob);
router.post('/jobs/reject/:id', adminWriteLimiter, AdminController.rejectJob);
router.patch('/jobs/applications/:id/status', adminWriteLimiter, AdminController.updateJobApplicationStatus);

// =====================
// BLOGS ROUTES
// =====================

// Read operations
router.get('/blogs', adminReadLimiter, AdminController.getAllBlogs);
router.get('/blogs/pending', adminReadLimiter, AdminController.pendingBlogs);
router.get('/blogs/:id', adminReadLimiter, AdminController.getBlogById);

// Write operations
router.post('/blogs/approve/:id', adminWriteLimiter, AdminController.approveBlog);
router.post('/blogs/reject/:id', adminWriteLimiter, AdminController.rejectBlog);

// =====================
// EVENTS ROUTES
// =====================

// Read operations
router.get('/events', adminReadLimiter, AdminController.getAllEvents);
router.get('/events/pending', adminReadLimiter, AdminController.pendingEvents);
router.get('/events/:id', adminReadLimiter, AdminController.getEventById);

// Write operations
router.post('/events/approve/:id', adminWriteLimiter, AdminController.approveEvent);
router.post('/events/reject/:id', adminWriteLimiter, AdminController.rejectEvent);

// =====================
// GALLERY ROUTES
// =====================

// Read operations
router.get('/gallery', adminReadLimiter, AdminController.getAllGallery);
router.get('/gallery/pending', adminReadLimiter, AdminController.pendingGallery);

// Write operations
router.post('/gallery/:id/approve', adminWriteLimiter, AdminController.approveGallery);
router.post('/gallery/:id/reject', adminWriteLimiter, AdminController.rejectGallery);
router.delete('/gallery/:id', adminWriteLimiter, AdminController.deleteGallery);

// =====================
// FEEDBACK ROUTES
// =====================

// Read operations
router.get('/feedback', adminReadLimiter, AdminController.getAllFeedback);
router.get('/feedback/pending', adminReadLimiter, AdminController.pendingFeedback);
router.get('/feedback/:id', adminReadLimiter, AdminController.getFeedbackById);

// Write operations
router.put('/feedback/:id', adminWriteLimiter, AdminController.updateFeedbackStatus);
router.delete('/feedback/:id', adminWriteLimiter, AdminController.deleteFeedback);

// =====================
// TOOLS ROUTES
// =====================

// Read operations
router.get('/tools', adminReadLimiter, AdminController.getAllTools);
router.get('/tools/:id', adminReadLimiter, AdminController.getToolById);

// Write operations
router.delete('/tools/:id', adminWriteLimiter, AdminController.deleteTool);

// =====================
// RESOURCES (KNOWLEDGE HUB) ROUTES
// =====================

// Read operations
router.get('/resources', adminReadLimiter, adminGetAllResources);
router.get('/resources/stats', adminReadLimiter, adminGetStats);
router.get('/resources/:id', adminReadLimiter, getResourceById);
router.get('/resources/:id/download', adminReadLimiter, downloadResource);

// Upload / Create operations
router.post('/resources/upload', adminWriteLimiter, upload.any(), uploadResource);
router.post('/resources', adminWriteLimiter, createResource);

// Update / Actions
router.put('/resources/:id', adminWriteLimiter, upload.single('file'), updateResource);
router.patch('/resources/:id/approve', adminWriteLimiter, approveResource);
router.patch('/resources/:id/reject', adminWriteLimiter, rejectResource);
router.delete('/resources/:id', adminWriteLimiter, deleteResource);

// =====================
// SEMINARS ROUTES
// =====================

// Read operations
router.get('/seminars', adminReadLimiter, AdminController.getAllSeminars);
router.get('/seminars/:id', adminReadLimiter, AdminController.getSeminarById);

// Write operations
router.delete('/seminars/:id', adminWriteLimiter, AdminController.deleteSeminar);

// =====================
// PROFILE ROUTES (Sensitive)
// =====================

router.get('/profile', adminReadLimiter, AdminController.getAdminProfile);
router.patch('/profile', adminSensitiveLimiter, AdminController.updateAdminProfile);
router.patch('/change-password', adminSensitiveLimiter, AdminController.changePassword);

// =====================
// SETTINGS ROUTES (Sensitive)
// =====================

router.get('/settings', adminReadLimiter, AdminController.getSettings);
router.patch('/settings', adminSensitiveLimiter, AdminController.updateSettings);

// =====================
// CRITICAL OPERATIONS (Very Restricted)
// =====================

router.get('/backup', adminCriticalLimiter, AdminController.createBackup);
router.post('/restore', adminCriticalLimiter, AdminController.restoreBackup);
router.post('/test-email', adminSensitiveLimiter, AdminController.sendTestEmail);

// =====================
// COMMUNICATIONS ROUTES
// =====================
router.post('/communications/send', adminSensitiveLimiter, sendBulkEmail);
router.get('/communications/logs', adminReadLimiter, getEmailLogs);

// Read operations
router.get('/groups', adminReadLimiter, AdminController.getAllGroups);
router.get('/groups/pending', adminReadLimiter, AdminController.pendingGroups);
router.get('/groups/:id', adminReadLimiter, AdminController.getGroupById);

// Write operations (approval/rejection)
router.post('/groups/approve/:id', adminWriteLimiter, AdminController.approveGroup);
router.post('/groups/reject/:id', adminWriteLimiter, AdminController.rejectGroup);

// Delete operation
router.delete('/groups/:id', adminWriteLimiter, AdminController.deleteGroup);

// =====================
// MANAGE ADMINS ROUTES (Superadmin Only)
// =====================
router.get('/admins', adminReadLimiter, requireRole('superadmin'), AdminController.listAdmins);
router.post('/admins', adminWriteLimiter, AdminController.createAdmin);
router.patch('/admins/:id', adminWriteLimiter, requireRole('superadmin'), AdminController.updateAdmin);
router.delete('/admins/:id', adminWriteLimiter, requireRole('superadmin'), AdminController.deleteAdmin);

export default router;