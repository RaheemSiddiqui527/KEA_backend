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
import Thread from "../models/thread.models.js";
import Group from "../models/group.models.js";
import mongoose from "mongoose";


const dashboardStats = async (req, res, next) => {
  try {
    const [
      totalMembers,
      membersPending,
      membersApproved,

      totalJobs,
      jobsPending,
      jobsApproved,

      totalBlogs,
      blogsPending,
      blogsApproved,

      totalEvents,
      eventsPending,
      eventsApproved,

      totalGallery,
      galleryPending,
      galleryApproved,

      totalFeedback,
      feedbackPending,
      feedbackResolved,

      totalGroups,
      groupsPending,
      groupsApproved,

      totalThreads,

      totalSeminars,
      seminarsPending,
      seminarsApproved,

      totalTools,
      toolsPending,
      toolsApproved,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ membershipStatus: "pending" }),
      User.countDocuments({ membershipStatus: "approved" }),

      Job.countDocuments(),
      Job.countDocuments({ status: "pending" }),
      Job.countDocuments({ status: "approved" }),

      Blog.countDocuments(),
      Blog.countDocuments({ status: "pending" }),
      Blog.countDocuments({ status: "approved" }),

      Event.countDocuments(),
      Event.countDocuments({ status: "pending" }),
      Event.countDocuments({ status: "approved" }),

      Gallery.countDocuments(),
      Gallery.countDocuments({ isApproved: false }),
      Gallery.countDocuments({ isApproved: true }),

      Feedback.countDocuments(),
      Feedback.countDocuments({ status: "pending" }),
      Feedback.countDocuments({ status: "resolved" }),

      Group.countDocuments(),
      Group.countDocuments({ status: "pending" }),
      Group.countDocuments({ status: "approved" }),

      Thread.countDocuments(),

      Seminar.countDocuments(),
      Seminar.countDocuments({ status: "pending" }),
      Seminar.countDocuments({ status: "approved" }),

      Tool.countDocuments(),
      Tool.countDocuments({ status: "pending" }),
      Tool.countDocuments({ status: "approved" }),
    ]);

    /* ======================
       🔥 ACTIVITY LOG
    ====================== */
    const [recentUsers, recentJobs, recentBlogs, recentThreads] =
      await Promise.all([
        User.find().sort({ createdAt: -1 }).limit(3).select("name createdAt"),
        Job.find().sort({ createdAt: -1 }).limit(3).select("title createdAt"),
        Blog.find().sort({ createdAt: -1 }).limit(3).select("title createdAt"),
        Thread.find().sort({ createdAt: -1 }).limit(3).select("title createdAt"),
      ]);

    const activities = [
      ...recentUsers.map(u => ({
        title: "New member joined",
        description: u.name,
        time: u.createdAt,
      })),
      ...recentJobs.map(j => ({
        title: "New job posted",
        description: j.title,
        time: j.createdAt,
      })),
      ...recentBlogs.map(b => ({
        title: "New blog published",
        description: b.title,
        time: b.createdAt,
      })),
      ...recentThreads.map(t => ({
        title: "New forum thread created",
        description: t.title,
        time: t.createdAt,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    /* ======================
       📈 MEMBERS GROWTH (30 DAYS)
    ====================== */
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const membersGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: last30Days } },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      stats: {
        members: { total: totalMembers, approved: membersApproved, pending: membersPending },
        jobs: { total: totalJobs, approved: jobsApproved, pending: jobsPending },
        blogs: { total: totalBlogs, approved: blogsApproved, pending: blogsPending },
        events: { total: totalEvents, approved: eventsApproved, pending: eventsPending },
        gallery: { total: totalGallery, approved: galleryApproved, pending: galleryPending },
        feedback: { total: totalFeedback, resolved: feedbackResolved, pending: feedbackPending },
        groups: { total: totalGroups, approved: groupsApproved, pending: groupsPending },
        forums: { total: totalThreads, approved: totalThreads, pending: 0 },
        seminars: { total: totalSeminars, approved: seminarsApproved, pending: seminarsPending },
        tools: { total: totalTools, approved: toolsApproved, pending: toolsPending },
      },
      activities,
      chartData: membersGrowth,
    });
  } catch (err) {
    next(err);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalMembers,
      membersApproved,
      membersPending,

      totalJobs,
      jobsApproved,
      jobsPending,

      totalBlogs,
      blogsApproved,
      blogsPending,

      totalEvents,
      eventsApproved,
      eventsPending,

      totalGallery,
      galleryApproved,
      galleryPending,

      totalFeedback,
      feedbackResolved,
      feedbackPending,

      totalTools,
      toolsApproved,
      toolsPending,

      totalResources,
      resourcesApproved,
      resourcesPending,

      totalSeminars,
      seminarsApproved,
      seminarsPending,

      totalThreads,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ membershipStatus: "active" }),
      User.countDocuments({ membershipStatus: "pending" }),

      Job.countDocuments(),
      Job.countDocuments({ status: "approved" }),
      Job.countDocuments({ status: "pending" }),

      Blog.countDocuments(),
      Blog.countDocuments({ status: "published" }),
      Blog.countDocuments({ status: "pending" }),

      Event.countDocuments(),
      Event.countDocuments({ status: "approved" }),
      Event.countDocuments({ status: "pending" }),

      Gallery.countDocuments(),
      Gallery.countDocuments({ isApproved: true }),
      Gallery.countDocuments({ isApproved: false }),

      Feedback.countDocuments(),
      Feedback.countDocuments({ status: "resolved" }),
      Feedback.countDocuments({ status: "pending" }),

      Tool.countDocuments(),
      Tool.countDocuments({ status: "approved" }),
      Tool.countDocuments({ status: "pending" }),

      Resource.countDocuments(),
      Resource.countDocuments({ status: "approved" }),
      Resource.countDocuments({ status: "pending" }),

      Seminar.countDocuments(),
      Seminar.countDocuments({ status: "approved" }),
      Seminar.countDocuments({ status: "pending" }),

      Thread.countDocuments(),
    ]);

    res.json({
      members: { total: totalMembers, approved: membersApproved, pending: membersPending },
      jobs: { total: totalJobs, approved: jobsApproved, pending: jobsPending },
      blogs: { total: totalBlogs, approved: blogsApproved, pending: blogsPending },
      events: { total: totalEvents, approved: eventsApproved, pending: eventsPending },
      gallery: { total: totalGallery, approved: galleryApproved, pending: galleryPending },
      feedback: { total: totalFeedback, resolved: feedbackResolved, pending: feedbackPending },
      tools: { total: totalTools, approved: toolsApproved, pending: toolsPending },
      resources: { total: totalResources, approved: resourcesApproved, pending: resourcesPending },
      seminars: { total: totalSeminars, approved: seminarsApproved, pending: seminarsPending },
      forums: { total: totalThreads, approved: totalThreads, pending: 0 },
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
    const { id } = req.params;

    // Find user and update membership status to 'active'
    const member = await User.findByIdAndUpdate(
      id,
      { membershipStatus: 'active' },
      { new: true }
    ).select('-password'); // Don't return password

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Send approval email
    try {
      await sendApprovalEmail(member.email, member.name);
      console.log('✅ Approval email sent to:', member.email);
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError);
      // Don't fail approval if email fails - just log it
    }

    res.json(member);

  } catch (err) {
    console.error('Error approving member:', err);
    next(err);
  }
};

// ---------------------------------------
// REJECT MEMBER (with email notification)
// ---------------------------------------
const rejectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason

    // Find user and update membership status to 'inactive'
    const member = await User.findByIdAndUpdate(
      id,
      { 
        membershipStatus: 'inactive',
        rejectionReason: reason || '' // Save rejection reason if provided
      },
      { new: true }
    ).select('-password');

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Send rejection email with reason
    try {
      await sendRejectionEmail(member.email, member.name, reason);
      console.log('✅ Rejection email sent to:', member.email);
    } catch (emailError) {
      console.error('❌ Failed to send rejection email:', emailError);
      // Don't fail rejection if email fails
    }

    res.json(member);

  } catch (err) {
    console.error('Error rejecting member:', err);
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

/**
 * Get all resources (Public/User view)
 */
export const getAllResources = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = { status: 'approved' }; // Only show approved resources to public

    if (category && category !== 'All resources') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('submittedBy', 'name email')
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

/**
 * Get resource by ID
 */
export const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('submittedBy', 'name email');
    
    if (!resource) {
      return res.status(404).json({ 
        success: false,
        message: "Resource not found" 
      });
    }
    
    res.json({
      success: true,
      resource
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete resource
 */
export const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ 
        success: false,
        message: "Resource not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Resource deleted successfully" 
    });
  } catch (err) {
    next(err);
  }
};

// ======================================================
// ================= ADMIN CONTROLLERS ==================
// ======================================================

/**
 * ADMIN: Get all resources (with status, category, search)
 */
export const adminGetAllResources = async (req, res) => {
  try {
    const {
      status,
      category,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all' && category !== 'All resources') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('submittedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Resource.countDocuments(query)
    ]);

    res.json({
      success: true,
      resources,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin Get All Resources Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin resources',
      message: error.message
    });
  }
};

/**
 * ADMIN: Resource stats (dashboard cards)
 */
export const adminGetStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Resource.countDocuments(),
      Resource.countDocuments({ status: 'pending' }),
      Resource.countDocuments({ status: 'approved' }),
      Resource.countDocuments({ status: 'rejected' })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected
      }
    });
  } catch (error) {
    console.error('Admin Get Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
};

/**
 * ADMIN: Get category statistics
 * This endpoint provides counts per category for the filter dropdown
 */
export const adminGetCategoryStats = async (req, res) => {
  try {
    // Get count per category using aggregation
    const categories = await Resource.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get total count for "All resources" option
    const totalCount = await Resource.countDocuments();

    // Format response with "All resources" option first
    const formattedCategories = [
      { name: 'All resources', count: totalCount },
      ...categories.map(cat => ({
        name: cat._id,
        count: cat.count
      }))
    ];

    res.json({
      success: true,
      categories: formattedCategories
    });
  } catch (error) {
    console.error('Admin Get Category Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category stats',
      message: error.message
    });
  }
};

/**
 * ADMIN: Approve resource
 */
export const approveResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        rejectionReason: null
      },
      { new: true }
    ).populate('submittedBy', 'name email');

    if (!resource) {
      return res.status(404).json({ 
        success: false,
        error: 'Resource not found' 
      });
    }

    res.json({
      success: true,
      message: 'Resource approved successfully',
      resource
    });
  } catch (error) {
    console.error('Approve Resource Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve resource',
      message: error.message
    });
  }
};

/**
 * ADMIN: Reject resource
 */
export const rejectResource = async (req, res) => {
  try {
    const { reason } = req.body;

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason || 'Rejected by admin'
      },
      { new: true }
    ).populate('submittedBy', 'name email');

    if (!resource) {
      return res.status(404).json({ 
        success: false,
        error: 'Resource not found' 
      });
    }

    res.json({
      success: true,
      message: 'Resource rejected successfully',
      resource
    });
  } catch (error) {
    console.error('Reject Resource Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject resource',
      message: error.message
    });
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
const getAllGroups = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const query = {};

    // Filter by approval status
    if (status) {
      query.approvalStatus = status;
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { discipline: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [groups, total] = await Promise.all([
      Group.find(query)
        .populate('creator', 'name email profile')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Group.countDocuments(query)
    ]);

    // Get status counts
    const statusCounts = await Group.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0 })
    });
  } catch (err) {
    next(err);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name email profile')
      .populate('approvedBy', 'name email')
      .populate('members.user', 'name email profile');

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (err) {
    next(err);
  }
};

const pendingGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ approvalStatus: 'pending' })
      .populate('creator', 'name email profile')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    next(err);
  }
};

const approveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.isApproved = true;
    group.isActive = true;
    group.approvalStatus = 'approved';
    group.approvedBy = req.user._id;
    group.approvedAt = new Date();
    group.rejectionReason = undefined;

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email')
      .populate('approvedBy', 'name email');

    res.json(updatedGroup);
  } catch (err) {
    next(err);
  }
};

const rejectGroup = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.isApproved = false;
    group.isActive = false;
    group.approvalStatus = 'rejected';
    group.rejectionReason = reason || 'Does not meet requirements';
    group.approvedBy = req.user._id;
    group.approvedAt = new Date();

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email')
      .populate('approvedBy', 'name email');

    res.json(updatedGroup);
  } catch (err) {
    next(err);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json({ message: "Group deleted successfully" });
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
  // Groups
  getAllGroups,
  getGroupById,
  pendingGroups,
  approveGroup,
  rejectGroup,
  deleteGroup
};