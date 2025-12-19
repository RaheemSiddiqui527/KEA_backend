import User from "../models/user.models.js";
import Job from "../models/job.models.js";
import Blog from "../models/blog.models.js";
import Event from "../models/event.models.js";
import Tool from "../models/tool.models.js";
import Resource from "../models/resource.models.js";
import Seminar from "../models/seminar.models.js";
import Gallery from "../models/gallery.models.js";
import Feedback from "../models/feedback.models.js";
import Mentor from "../models/mentor.models.js";

const dashboardStats = async (req, res, next) => {
  try {
    const [
      membersPending,
      jobsPending,
      blogsPending,
      eventsPending,
      galleryPending,
      feedbackPending,
      totalMembers,
      totalJobs,
      totalBlogs,
      totalGallery,
      totalFeedback
    ] = await Promise.all([
      User.countDocuments({ membershipStatus: "pending" }),
      Job.countDocuments({ status: "pending" }),
      Blog.countDocuments({ status: "pending" }),
      Event.countDocuments({ status: "pending" }),
      Gallery.countDocuments({ isApproved: false }),
      Feedback.countDocuments({ status: "pending" }),
      User.countDocuments(),
      Job.countDocuments(),
      Blog.countDocuments(),
      Gallery.countDocuments({ isApproved: true }),
      Feedback.countDocuments()
    ]);

    // 🔥 RECENT ACTIVITIES
    const recentMembers = await User.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select("name createdAt");

    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select("title createdAt");

    const recentGallery = await Gallery.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select("title createdAt");

    const activities = [
      ...recentMembers.map(m => ({
        title: "New member joined",
        time: m.createdAt,
        description: m.name
      })),
      ...recentJobs.map(j => ({
        title: "New job posted",
        time: j.createdAt,
        description: j.title
      })),
      ...recentGallery.map(g => ({
        title: "New photo uploaded",
        time: g.createdAt,
        description: g.title
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json({
      stats: {
        totalMembers,
        pendingApprovals: membersPending + jobsPending + blogsPending + eventsPending + galleryPending + feedbackPending,
        totalJobs,
        blogs: totalBlogs,
        gallery: totalGallery,
        feedback: totalFeedback
      },
      activities,
    });
  } catch (err) {
    next(err);
  }
};

// Members
const getMemberById = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

const getAllMembers = async (req, res, next) => {
  try {
    const members = await User.find({ role: "user" });
    res.json(members);
  } catch (err) {
    next(err);
  }
};

const pendingMembers = async (req, res, next) => {
  try {
    const members = await User.find({ membershipStatus: "pending" });
    res.json(members);
  } catch (err) {
    next(err);
  }
};

const approveMember = async (req, res, next) => {
  try {
    const member = await User.findByIdAndUpdate(
      req.params.id,
      { membershipStatus: "active" },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

const rejectMember = async (req, res, next) => {
  try {
    const member = await User.findByIdAndUpdate(
      req.params.id,
      { membershipStatus: "inactive" },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

// Jobs
const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find()
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate("postedBy", "name email");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const pendingJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ status: "pending" }).populate("postedBy", "name email");
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

const approveJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("postedBy", "name email");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const rejectJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).populate("postedBy", "name email");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
};

// Blogs
const getAllBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    next(err);
  }
};

const getBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email");
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    next(err);
  }
};

const pendingBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ status: "pending" }).populate("author", "name email");
    res.json(blogs);
  } catch (err) {
    next(err);
  }
};

const approveBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status: "published" },
      { new: true }
    ).populate("author", "name email");
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    next(err);
  }
};

const rejectBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).populate("author", "name email");
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    next(err);
  }
};

// Events
const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate("organizer", "name email")
      .sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

const pendingEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ status: "pending" }).populate("organizer", "name email");
    res.json(events);
  } catch (err) {
    next(err);
  }
};

const approveEvent = async (req, res, next) => {
  try {
    const ev = await Event.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("organizer", "name email");
    if (!ev) return res.status(404).json({ message: "Event not found" });
    res.json(ev);
  } catch (err) {
    next(err);
  }
};

const rejectEvent = async (req, res, next) => {
  try {
    const ev = await Event.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    ).populate("organizer", "name email");
    if (!ev) return res.status(404).json({ message: "Event not found" });
    res.json(ev);
  } catch (err) {
    next(err);
  }
};

// =====================
// GALLERY MANAGEMENT
// =====================
const getAllGallery = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (category && category !== 'All photos') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, total] = await Promise.all([
      Gallery.find(query)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Gallery.countDocuments(query)
    ]);
    
    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const pendingGallery = async (req, res, next) => {
  try {
    const items = await Gallery.find({ isApproved: false })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const approveGallery = async (req, res, next) => {
  try {
    const item = await Gallery.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true, runValidators: false }
    ).populate('uploadedBy', 'name email');
    
    if (!item) return res.status(404).json({ message: "Gallery item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const rejectGallery = async (req, res, next) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Gallery item not found" });
    res.json({ message: "Gallery item rejected and deleted" });
  } catch (err) {
    next(err);
  }
};

const deleteGallery = async (req, res, next) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Gallery item not found" });
    res.json({ message: "Gallery item deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// =====================
// FEEDBACK MANAGEMENT
// =====================
const getAllFeedback = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [feedbacks, total] = await Promise.all([
      Feedback.find(query)
        .populate('user', 'name email')
        .populate('adminResponse.respondedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Feedback.countDocuments(query)
    ]);
    
    res.json({
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const getFeedbackById = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user', 'name email profile')
      .populate('adminResponse.respondedBy', 'name email');
    
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json(feedback);
  } catch (err) {
    next(err);
  }
};

const pendingFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ status: 'pending' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
};

const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, response } = req.body;
    
    const updateData = { status };
    
    if (response) {
      updateData.adminResponse = {
        message: response,
        respondedBy: req.user._id,
        respondedAt: new Date()
      };
    }
    
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    )
    .populate('user', 'name email')
    .populate('adminResponse.respondedBy', 'name email');
    
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json(feedback);
  } catch (err) {
    next(err);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// =====================
// TOOLS MANAGEMENT
// =====================
const getAllTools = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (category && category !== 'All tools') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tools, total] = await Promise.all([
      Tool.find(query)
        .populate('addedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Tool.countDocuments(query)
    ]);
    
    res.json({
      tools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const getToolById = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id).populate('addedBy', 'name email');
    if (!tool) return res.status(404).json({ message: "Tool not found" });
    res.json(tool);
  } catch (err) {
    next(err);
  }
};

const deleteTool = async (req, res, next) => {
  try {
    const tool = await Tool.findByIdAndDelete(req.params.id);
    if (!tool) return res.status(404).json({ message: "Tool not found" });
    res.json({ message: "Tool deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// =====================
// RESOURCES (KNOWLEDGE HUB) MANAGEMENT
// =====================
const getAllResources = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (category && category !== 'All resources') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('addedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Resource.countDocuments(query)
    ]);
    
    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('addedBy', 'name email');
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json(resource);
  } catch (err) {
    next(err);
  }
};

const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// =====================
// SEMINARS MANAGEMENT
// =====================
const getAllSeminars = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [seminars, total] = await Promise.all([
      Seminar.find(query)
        .populate('attendees', 'name email')
        .populate('addedBy', 'name email')
        .sort({ date: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Seminar.countDocuments(query)
    ]);
    
    res.json({
      seminars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const getSeminarById = async (req, res, next) => {
  try {
    const seminar = await Seminar.findById(req.params.id)
      .populate('attendees', 'name email profile')
      .populate('addedBy', 'name email');
    if (!seminar) return res.status(404).json({ message: "Seminar not found" });
    res.json(seminar);
  } catch (err) {
    next(err);
  }
};

const deleteSeminar = async (req, res, next) => {
  try {
    const seminar = await Seminar.findByIdAndDelete(req.params.id);
    if (!seminar) return res.status(404).json({ message: "Seminar not found" });
    res.json({ message: "Seminar deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Profile
const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id).select("-password");
    res.json(admin);
  } catch (err) {
    next(err);
  }
};

const updateAdminProfile = async (req, res, next) => {
  try {
    const { name, email, phone, avatar } = req.body;
    const admin = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone, avatar },
      { new: true, runValidators: true }
    ).select("-password");
    res.json(admin);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(req.user._id);
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    admin.password = newPassword;
    await admin.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [
      membersApproved, 
      jobsApproved, 
      blogsApproved, 
      eventsApproved,
      galleryApproved,
      feedbackResolved,
      totalTools,
      totalResources,
      totalSeminars
    ] = await Promise.all([
      User.countDocuments({ membershipStatus: "active" }),
      Job.countDocuments({ status: "approved" }),
      Blog.countDocuments({ status: "published" }),
      Event.countDocuments({ status: "approved" }),
      Gallery.countDocuments({ isApproved: true }),
      Feedback.countDocuments({ status: "resolved" }),
      Tool.countDocuments(),
      Resource.countDocuments(),
      Seminar.countDocuments(),
    ]);

    const totalReviews = membersApproved + jobsApproved + blogsApproved + eventsApproved + galleryApproved;

    res.json({
      membersApproved,
      jobsApproved,
      blogsApproved,
      eventsApproved,
      galleryApproved,
      feedbackResolved,
      totalReviews,
      totalTools,
      totalResources,
      totalSeminars,
    });
  } catch (err) {
    next(err);
  }
};

// Settings & Backup
const getSettings = async (req, res, next) => {
  try {
    const settings = {
      siteName: "KEA Admin Portal",
      siteUrl: "",
      adminEmail: "",
      contactEmail: "",
      allowRegistration: true,
      requireEmailVerification: true,
      defaultMembershipStatus: "pending",
    };
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    res.json(req.body);
  } catch (err) {
    next(err);
  }
};

const createBackup = async (req, res, next) => {
  try {
    const [users, jobs, blogs, events, tools, resources, seminars, gallery, feedback] = await Promise.all([
      User.find(),
      Job.find(),
      Blog.find(),
      Event.find(),
      Tool.find(),
      Resource.find(),
      Seminar.find(),
      Gallery.find(),
      Feedback.find(),
    ]);

    const backup = {
      timestamp: new Date(),
      users,
      jobs,
      blogs,
      events,
      tools,
      resources,
      seminars,
      gallery,
      feedback,
    };

    res.json(backup);
  } catch (err) {
    next(err);
  }
};

const restoreBackup = async (req, res, next) => {
  try {
    const backup = req.body;
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Blog.deleteMany({}),
      Event.deleteMany({}),
      Tool.deleteMany({}),
      Resource.deleteMany({}),
      Seminar.deleteMany({}),
      Gallery.deleteMany({}),
      Feedback.deleteMany({}),
    ]);

    await Promise.all([
      User.insertMany(backup.users),
      Job.insertMany(backup.jobs),
      Blog.insertMany(backup.blogs),
      Event.insertMany(backup.events),
      Tool.insertMany(backup.tools || []),
      Resource.insertMany(backup.resources || []),
      Seminar.insertMany(backup.seminars || []),
      Gallery.insertMany(backup.gallery || []),
      Feedback.insertMany(backup.feedback || []),
    ]);

    res.json({ message: "Backup restored successfully" });
  } catch (err) {
    next(err);
  }
};

const sendTestEmail = async (req, res, next) => {
  try {
    res.json({ message: "Test email functionality not implemented" });
  } catch (err) {
    next(err);
  }
};

export default {
  getMemberById,
  pendingMembers,
  approveMember,
  rejectMember,
  pendingJobs,
  approveJob,
  rejectJob,
  pendingBlogs,
  approveBlog,
  rejectBlog,
  pendingEvents,
  approveEvent,
  rejectEvent,
  dashboardStats,
  getAllMembers,
  getAllJobs,
  getJobById,
  getAllBlogs,
  getBlogById,
  getAllEvents,
  getEventById,
  getAdminProfile,
  updateAdminProfile,
  getAdminStats,
  changePassword,
  getSettings,
  updateSettings,
  createBackup,
  restoreBackup,
  sendTestEmail,
  // Tools
  getAllTools,
  getToolById,
  deleteTool,
  // Resources
  getAllResources,
  getResourceById,
  deleteResource,
  // Seminars
  getAllSeminars,
  getSeminarById,
  deleteSeminar,
  // Gallery
  getAllGallery,
  pendingGallery,
  approveGallery,
  rejectGallery,
  deleteGallery,
  // Feedback
  getAllFeedback,
  getFeedbackById,
  pendingFeedback,
  updateFeedbackStatus,
  deleteFeedback,
};