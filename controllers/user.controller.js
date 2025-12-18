import User from '../models/user.models.js';
import Resume from '../models/resume.models.js';
import JobApplication from '../models/jobApplication.models.js';
import SavedJob from '../models/savedJob.models.js';
import EventRegistration from '../models/eventRegistration.models.js'; // Fixed: lowercase
import Connection from '../models/connection.models.js';
import Activity from '../models/activity.models.js';
import Notification from '../models/notification.models.js';

// Get current user
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) { 
    next(err); 
  }
};

// Update current user
export const updateMe = async (req, res, next) => {
  try {
    const updateData = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.avatar) updateData.avatar = req.body.avatar;

    if (req.body.profile) {
      for (const key of Object.keys(req.body.profile)) {
        updateData[`profile.${key}`] = req.body.profile[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    next(err);
  }
};


// Get dashboard stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      applications,
      savedJobs,
      eventsRegistered,
      connections,
      lastMonthApplications,
      lastMonthSavedJobs,
      lastMonthEvents,
      lastMonthConnections
    ] = await Promise.all([
      // Current counts
      JobApplication.countDocuments({ user: userId }),
      SavedJob.countDocuments({ user: userId }),
      EventRegistration.countDocuments({ user: userId }),
      Connection.countDocuments({ user: userId }),
      
      // Last month stats for comparison
      JobApplication.countDocuments({ 
        user: userId, 
        createdAt: { $lt: thirtyDaysAgo }
      }),
      SavedJob.countDocuments({ 
        user: userId, 
        createdAt: { $lt: thirtyDaysAgo }
      }),
      EventRegistration.countDocuments({ 
        user: userId, 
        createdAt: { $lt: thirtyDaysAgo }
      }),
      Connection.countDocuments({ 
        user: userId, 
        createdAt: { $lt: thirtyDaysAgo }
      }),
    ]);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      applications: applications || 0,
      savedJobs: savedJobs || 0,
      eventsRegistered: eventsRegistered || 0,
      connections: connections || 0,
      applicationsChange: calculateChange(applications, lastMonthApplications),
      savedJobsChange: calculateChange(savedJobs, lastMonthSavedJobs),
      eventsChange: calculateChange(eventsRegistered, lastMonthEvents),
      connectionsChange: calculateChange(connections, lastMonthConnections),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    // Return default values if models don't exist yet
    res.json({
      applications: 0,
      savedJobs: 0,
      eventsRegistered: 0,
      connections: 0,
      applicationsChange: 0,
      savedJobsChange: 0,
      eventsChange: 0,
      connectionsChange: 0,
    });
  }
};

// Get recent activity
export const getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const activities = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json(activities);
  } catch (err) {
    console.error('Recent activity error:', err);
    res.json([]);
  }
};

// Get user notifications
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit = 10, unreadOnly = false } = req.query;
    
    const query = { recipient: userId };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(notifications);
  } catch (err) {
    console.error('Notifications error:', err);
    res.json([]);
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

// Upload resume
export const uploadResume = async (req, res, next) => {
  try {
    // console.log('=== Resume Upload Request ===');
    // console.log('User:', req.user._id);
    // console.log('File:', req.file);
    // console.log('Body:', req.body);

    if (!req.file) {
      // console.log('❌ No file in request');
      return res.status(400).json({ message: 'No file provided' });
    }
    
    const resume = await Resume.create({ 
      user: req.user._id, 
      title: req.body.title || 'Resume', 
      file: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
    
    // console.log('✅ Resume saved to DB:', resume);
    // console.log(`📁 File saved at: uploads/${req.file.filename}`);
    // console.log(`🔗 Accessible at: http://localhost:5000/uploads/${req.file.filename}`);

    // Create activity
    await Activity.create({
      user: req.user._id,
      type: 'document_download',
      title: 'Resume uploaded',
      description: `Uploaded ${req.file.originalname}`
    }).catch(err => console.log('⚠️ Activity creation failed:', err));
    
    res.json(resume);
  } catch (err) { 
    console.error('❌ Upload error:', err);
    next(err); 
  }
};

// Get user's resumes
export const getMyResumes = async (req, res, next) => {
  try {
    // console.log('📋 Fetching resumes for user:', req.user._id);
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    // console.log(`✅ Found ${resumes.length} resumes`);
    res.json(resumes);
  } catch (err) {
    console.error('❌ Error fetching resumes:', err);
    next(err);
  }
};

// Delete resume
export const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// List all members (public)
export const listMembers = async (req, res, next) => {
  try {
    const { search, category, location, page = 1, limit = 20 } = req.query;
    
    const query = { 
      membershipStatus: 'active',
      role: 'user' 
    };
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'profile.headline': { $regex: search, $options: 'i' } },
        { 'profile.bio': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category) {
      query['profile.category'] = category;
    }
    
    // Add location filter
    if (location) {
      query['profile.location'] = { $regex: location, $options: 'i' };
    }
    
    const skip = (page - 1) * limit;
    
    const [members, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);
    
    res.json({
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) { 
    next(err); 
  }
};

// Get single member (public)
export const getMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id)
      .select('-password');
      
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json(member);
  } catch (err) { 
    next(err); 
  }
};

// Save a job
export const saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    
    // Check if already saved
    const existing = await SavedJob.findOne({
      user: req.user._id,
      job: jobId
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Job already saved' });
    }
    
    const savedJob = await SavedJob.create({
      user: req.user._id,
      job: jobId
    });
    
    // Create activity
    await Activity.create({
      user: req.user._id,
      type: 'job_application',
      title: 'Job saved',
      description: 'You saved a job posting',
      relatedId: jobId,
      relatedModel: 'Job'
    }).catch(err => console.log('⚠️ Activity creation failed:', err));
    
    res.json(savedJob);
  } catch (err) {
    next(err);
  }
};

// Get saved jobs
export const getSavedJobs = async (req, res, next) => {
  try {
    const savedJobs = await SavedJob.find({ user: req.user._id })
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(savedJobs);
  } catch (err) {
    next(err);
  }
};

// Apply for a job
export const applyForJob = async (req, res, next) => {
  try {
    const { jobId, coverLetter, resumeId } = req.body;
    
    // Check if already applied
    const existing = await JobApplication.findOne({
      user: req.user._id,
      job: jobId
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }
    
    const application = await JobApplication.create({
      user: req.user._id,
      job: jobId,
      coverLetter,
      resume: resumeId,
      status: 'pending'
    });
    
    // Create activity
    await Activity.create({
      user: req.user._id,
      type: 'job_application',
      title: 'Applied for job',
      description: 'You applied for a new position',
      relatedId: jobId,
      relatedModel: 'Job'
    }).catch(err => console.log('⚠️ Activity creation failed:', err));
    
    res.json(application);
  } catch (err) {
    next(err);
  }
};

// Get my job applications
export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await JobApplication.find({ user: req.user._id })
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
};

// Register for an event
export const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    
    // Check if already registered
    const existing = await EventRegistration.findOne({
      user: req.user._id,
      event: eventId
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    
    const registration = await EventRegistration.create({
      user: req.user._id,
      event: eventId,
      status: 'confirmed'
    });
    
    // Create activity
    await Activity.create({
      user: req.user._id,
      type: 'event_registration',
      title: 'Registered for event',
      description: 'You registered for a new event',
      relatedId: eventId,
      relatedModel: 'Event'
    }).catch(err => console.log('⚠️ Activity creation failed:', err));
    
    res.json(registration);
  } catch (err) {
    next(err);
  }
};

// Get my event registrations
export const getMyEventRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.find({ user: req.user._id })
      .populate('event')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (err) {
    next(err);
  }
};

// Connect with another user
export const connectWithUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }
    
    // Check if already connected
    const existing = await Connection.findOne({
      user: req.user._id,
      connectedUser: userId
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Already connected' });
    }
    
    const connection = await Connection.create({
      user: req.user._id,
      connectedUser: userId,
      status: 'pending'
    });
    
    // Create activity
    await Activity.create({
      user: req.user._id,
      type: 'connection',
      title: 'Connection request sent',
      description: 'You sent a connection request',
      relatedId: userId,
      relatedModel: 'User'
    }).catch(err => console.log('⚠️ Activity creation failed:', err));
    
    res.json(connection);
  } catch (err) {
    next(err);
  }
};

// Get my connections
export const getMyConnections = async (req, res, next) => {
  try {
    const connections = await Connection.find({ 
      user: req.user._id,
      status: 'accepted'
    })
      .populate('connectedUser', '-password')
      .sort({ createdAt: -1 });
    res.json(connections);
  } catch (err) {
    next(err);
  }
};

export default {
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
  applyForJob,
  getMyApplications,
  registerForEvent,
  getMyEventRegistrations,
  connectWithUser,
  getMyConnections
};