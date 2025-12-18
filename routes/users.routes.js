import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import upload from '../utils/upload.js';
import UserController from '../controllers/user.controller.js';

const router = express.Router();

// Profile
router.get('/me', auth, UserController.getMe);
router.put('/me', auth, UserController.updateMe);

// Dashboard
router.get('/dashboard/stats', auth, UserController.getDashboardStats);
router.get('/dashboard/activity', auth, UserController.getRecentActivity);

// Notifications
router.get('/notifications', auth, UserController.getUserNotifications);
router.patch('/notifications/:id/read', auth, UserController.markNotificationRead);

// Resume
router.post('/me/resume', auth, upload.single('file'), UserController.uploadResume);
router.get('/me/resumes', auth, UserController.getMyResumes);
router.delete('/me/resumes/:id', auth, UserController.deleteResume);

// Jobs
router.post('/jobs/save', auth, UserController.saveJob);
router.get('/jobs/saved', auth, UserController.getSavedJobs);
router.post('/jobs/apply', auth, UserController.applyForJob);
router.get('/jobs/applications', auth, UserController.getMyApplications);

// Events
router.post('/events/register', auth, UserController.registerForEvent);
router.get('/events/registrations', auth, UserController.getMyEventRegistrations);

// Connections
router.post('/connections', auth, UserController.connectWithUser);
router.get('/connections', auth, UserController.getMyConnections);

// Public routes
router.get('/members', UserController.listMembers);
router.get('/members/:id', UserController.getMember);

export default router;