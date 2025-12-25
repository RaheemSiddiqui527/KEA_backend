import express from 'express';
import rateLimit from 'express-rate-limit';
import AdminController from '../controllers/admin.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();

// =====================
// RATE LIMITERS
// =====================

// Standard rate limiter for admin GET requests - 200 requests per 15 minutes
const adminReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this admin account, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Moderate rate limiter for admin write operations - 100 requests per 15 minutes
const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many write operations, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for sensitive operations - 20 requests per 15 minutes
const adminSensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many sensitive operations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiter for critical operations - 5 requests per 15 minutes
const adminCriticalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

// =====================
// MEMBERS ROUTES
// =====================

// Read operations
router.get('/members', adminReadLimiter, AdminController.getAllMembers);
router.get('/members/pending', adminReadLimiter, AdminController.pendingMembers);
router.get('/members/:id', adminReadLimiter, AdminController.getMemberById);

// Write operations (approval/rejection)
router.patch('/members/:id/approve', adminWriteLimiter, AdminController.approveMember);
router.patch('/members/:id/reject', adminWriteLimiter, AdminController.rejectMember);

// =====================
// JOBS ROUTES
// =====================

// Read operations
router.get('/jobs', adminReadLimiter, AdminController.getAllJobs);
router.get('/jobs/pending', adminReadLimiter, AdminController.pendingJobs);
router.get('/jobs/:id', adminReadLimiter, AdminController.getJobById);

// Write operations
router.post('/jobs/approve/:id', adminWriteLimiter, AdminController.approveJob);
router.post('/jobs/reject/:id', adminWriteLimiter, AdminController.rejectJob);

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
router.get('/resources', adminReadLimiter, AdminController.getAllResources);
router.get('/resources/:id', adminReadLimiter, AdminController.getResourceById);

// Write operations
router.delete('/resources/:id', adminWriteLimiter, AdminController.deleteResource);

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

router.post('/backup', adminCriticalLimiter, AdminController.createBackup);
router.post('/restore', adminCriticalLimiter, AdminController.restoreBackup);
router.post('/test-email', adminSensitiveLimiter, AdminController.sendTestEmail);

// Read operations
router.get('/groups', adminReadLimiter, AdminController.getAllGroups);
router.get('/groups/pending', adminReadLimiter, AdminController.pendingGroups);
router.get('/groups/:id', adminReadLimiter, AdminController.getGroupById);

// Write operations (approval/rejection)
router.post('/groups/approve/:id', adminWriteLimiter, AdminController.approveGroup);
router.post('/groups/reject/:id', adminWriteLimiter, AdminController.rejectGroup);

// Delete operation
router.delete('/groups/:id', adminWriteLimiter, AdminController.deleteGroup);
export default router;