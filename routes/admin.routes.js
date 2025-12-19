import express from 'express';
import AdminController from '../controllers/admin.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

router.get('/dashboard', AdminController.dashboardStats);

// Members routes
router.get('/members', AdminController.getAllMembers);
router.get('/members/pending', AdminController.pendingMembers);
router.get('/members/:id', AdminController.getMemberById);
router.patch('/members/:id/approve', AdminController.approveMember);
router.patch('/members/:id/reject', AdminController.rejectMember);

// Jobs routes
router.get('/jobs', AdminController.getAllJobs);
router.get('/jobs/pending', AdminController.pendingJobs);
router.get('/jobs/:id', AdminController.getJobById);
router.post('/jobs/approve/:id', AdminController.approveJob);
router.post('/jobs/reject/:id', AdminController.rejectJob);

// Blogs routes
router.get('/blogs', AdminController.getAllBlogs);
router.get('/blogs/pending', AdminController.pendingBlogs);
router.get('/blogs/:id', AdminController.getBlogById);
router.post('/blogs/approve/:id', AdminController.approveBlog);
router.post('/blogs/reject/:id', AdminController.rejectBlog);

// Events routes
router.get('/events', AdminController.getAllEvents);
router.get('/events/pending', AdminController.pendingEvents);
router.get('/events/:id', AdminController.getEventById);
router.post('/events/approve/:id', AdminController.approveEvent);
router.post('/events/reject/:id', AdminController.rejectEvent);

// Gallery routes
router.get('/gallery', AdminController.getAllGallery);
router.get('/gallery/pending', AdminController.pendingGallery);
router.post('/gallery/:id/approve', AdminController.approveGallery);
router.post('/gallery/:id/reject', AdminController.rejectGallery);
router.delete('/gallery/:id', AdminController.deleteGallery);

// Feedback routes
router.get('/feedback', AdminController.getAllFeedback);
router.get('/feedback/pending', AdminController.pendingFeedback);
router.get('/feedback/:id', AdminController.getFeedbackById);
router.put('/feedback/:id', AdminController.updateFeedbackStatus);
router.delete('/feedback/:id', AdminController.deleteFeedback);

// Tools routes
router.get('/tools', AdminController.getAllTools);
router.get('/tools/:id', AdminController.getToolById);
router.delete('/tools/:id', AdminController.deleteTool);

// Resources (Knowledge Hub) routes
router.get('/resources', AdminController.getAllResources);
router.get('/resources/:id', AdminController.getResourceById);
router.delete('/resources/:id', AdminController.deleteResource);

// Seminars routes
router.get('/seminars', AdminController.getAllSeminars);
router.get('/seminars/:id', AdminController.getSeminarById);
router.delete('/seminars/:id', AdminController.deleteSeminar);

// Profile routes
router.get('/profile', AdminController.getAdminProfile);
router.patch('/profile', AdminController.updateAdminProfile);
router.patch('/change-password', AdminController.changePassword);
router.get('/stats', AdminController.getAdminStats);

// Settings routes
router.get('/settings', AdminController.getSettings);
router.patch('/settings', AdminController.updateSettings);
router.post('/backup', AdminController.createBackup);
router.post('/restore', AdminController.restoreBackup);
router.post('/test-email', AdminController.sendTestEmail);

export default router;