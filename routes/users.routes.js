import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import userController from '../controllers/user.controller.js';
import upload from '../middleware/upload.middleware.js';
import Resume from '../models/resume.models.js';
import { getSignedWasabiUrl } from '../utils/wasabi.utils.js';

const router = express.Router();

const {
  getMe,
  updateMe,
  getDashboardStats,
  getRecentActivity,
  getUserNotifications,
  markNotificationRead,
  uploadResume,
  getMyResumes,
  deleteResume,
  listMembers,
  getMember,
  saveJob,
  getSavedJobs,
  deleteSavedJob,
  applyForJob,
  getMyApplications,
  registerForEvent,
  getMyEventRegistrations,
  connectWithUser,
  getMyConnections,
} = userController;

// ================= PUBLIC ROUTES =================
router.get('/members', listMembers);
router.get('/members/:id', getMember);

// ================= PROTECTED ROUTES =================
router.use(auth);

// User profile
router.get('/me', getMe);
router.patch('/me', updateMe);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activity', getRecentActivity);

// Notifications
router.get('/notifications', getUserNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// Resumes
router.post('/me/resumes', upload.single('file'), uploadResume);
router.get('/me/resumes', getMyResumes);
router.delete('/me/resumes/:id', deleteResume);

router.get('/me/resumes/:id/view', async (req, res) => {
  const resume = await Resume.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!resume) return res.sendStatus(404);

  const signedUrl = await getSignedWasabiUrl(resume.wasabiKey);
  res.json({ url: signedUrl });
});

// Jobs
router.post('/jobs/save', saveJob);
router.get('/jobs/saved', getSavedJobs);
router.delete('/jobs/saved/:id', deleteSavedJob);
router.post('/jobs/apply', applyForJob);
router.get('/jobs/applications', getMyApplications);

// Events
router.post('/events/register', registerForEvent);
router.get('/events/registrations', getMyEventRegistrations);

// Connections
router.post('/connections', connectWithUser);
router.get('/connections', getMyConnections);



export default router;
