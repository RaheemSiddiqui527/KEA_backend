import Mentor from '../models/mentor.models.js';

// Get all approved mentors (public)
export const listMentors = async (req, res) => {
  try {
    const { search, expertise, experience, page = 1, limit = 12 } = req.query;
    
    // Only show approved and active mentors to public
    const query = { 
      isActive: true, 
      isApproved: true,
      approvalStatus: 'approved'
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { expertise: { $in: [new RegExp(search, 'i')] } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (expertise) {
      query.expertise = { $in: [expertise] };
    }
    
    if (experience) {
      query['experience.years'] = { $gte: parseInt(experience) };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const mentors = await Mentor.find(query)
      .populate('user', 'name email')
      .sort({ 'stats.rating': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Mentor.countDocuments(query);
    
    res.json({
      mentors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Error in listMentors:', err);
    res.status(500).json({ message: 'Error fetching mentors', error: err.message });
  }
};

// Get all mentors for admin (includes pending)
export const getAllMentorsAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.approvalStatus = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const mentors = await Mentor.find(query)
      .populate('user', 'name email profile')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Mentor.countDocuments(query);
    
    // Get counts for each status
    const statusCounts = await Mentor.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      mentors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (err) {
    console.error('❌ Error in getAllMentorsAdmin:', err);
    res.status(500).json({ message: 'Error fetching mentors', error: err.message });
  }
};

// Get single mentor
export const getMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
      .populate('user', 'name email profile')
      .populate('availability.bookedBy', 'name email')
      .populate('approvedBy', 'name email')
      .lean();
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    // Only show approved mentors to public (unless it's the mentor themselves or admin)
    if (!mentor.isApproved && mentor.user._id.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    res.json(mentor);
  } catch (err) {
    console.error('❌ Error in getMentor:', err);
    res.status(500).json({ message: 'Error fetching mentor', error: err.message });
  }
};

// Create mentor (requires approval)
export const createMentor = async (req, res) => {
  try {
    // Check if user already has a mentor profile
    const existingMentor = await Mentor.findOne({ user: req.user._id });
    if (existingMentor) {
      return res.status(400).json({ 
        message: 'You already have a mentor profile',
        status: existingMentor.approvalStatus
      });
    }
    
    const mentorData = {
      ...req.body,
      user: req.user._id,
      isApproved: false,
      isActive: false,
      approvalStatus: 'pending'
    };
    
    const mentor = await Mentor.create(mentorData);
    
    const populatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'name email')
      .lean();
    
    res.status(201).json({
      message: 'Mentor profile submitted successfully! It will be reviewed by an administrator.',
      mentor: populatedMentor
    });
  } catch (err) {
    console.error('❌ Error in createMentor:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Error creating mentor', error: err.message });
  }
};

// Update mentor
export const updateMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found or unauthorized' });
    }
    
    // If mentor updates after being approved, reset to pending
    if (mentor.isApproved) {
      mentor.approvalStatus = 'pending';
      mentor.isApproved = false;
      mentor.isActive = false;
    }
    
    Object.assign(mentor, req.body);
    await mentor.save();
    
    const updatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'name email')
      .lean();
    
    res.json({
      message: mentor.approvalStatus === 'pending' 
        ? 'Profile updated successfully! Your changes will be reviewed by an administrator.'
        : 'Profile updated successfully!',
      mentor: updatedMentor
    });
  } catch (err) {
    console.error('❌ Error in updateMentor:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Error updating mentor', error: err.message });
  }
};

// Admin: Approve mentor
export const approveMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    mentor.isApproved = true;
    mentor.isActive = true;
    mentor.approvalStatus = 'approved';
    mentor.approvedBy = req.user._id;
    mentor.approvedAt = new Date();
    mentor.rejectionReason = undefined;
    
    await mentor.save();
    
    const updatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'name email')
      .populate('approvedBy', 'name email')
      .lean();
    
    res.json({
      message: 'Mentor approved successfully',
      mentor: updatedMentor
    });
  } catch (err) {
    console.error('❌ Error in approveMentor:', err);
    res.status(500).json({ message: 'Error approving mentor', error: err.message });
  }
};

// Admin: Reject mentor
export const rejectMentor = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const mentor = await Mentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    mentor.isApproved = false;
    mentor.isActive = false;
    mentor.approvalStatus = 'rejected';
    mentor.rejectionReason = reason || 'Does not meet requirements';
    mentor.approvedBy = req.user._id;
    mentor.approvedAt = new Date();
    
    await mentor.save();
    
    const updatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'name email')
      .populate('approvedBy', 'name email')
      .lean();
    
    res.json({
      message: 'Mentor rejected',
      mentor: updatedMentor
    });
  } catch (err) {
    console.error('❌ Error in rejectMentor:', err);
    res.status(500).json({ message: 'Error rejecting mentor', error: err.message });
  }
};

// Book mentorship session
export const bookSession = async (req, res) => {
  try {
    const { slotId } = req.body;
    
    const mentor = await Mentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    if (!mentor.isApproved || !mentor.isActive) {
      return res.status(400).json({ message: 'This mentor is not available for booking' });
    }
    
    const slot = mentor.availability.id(slotId);
    
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Slot already booked' });
    }
    
    slot.isBooked = true;
    slot.bookedBy = req.user._id;
    
    mentor.stats.totalSessions += 1;
    await mentor.save();
    
    res.json({ message: 'Session booked successfully', mentor });
  } catch (err) {
    console.error('❌ Error in bookSession:', err);
    res.status(500).json({ message: 'Error booking session', error: err.message });
  }
};

// Get mentor stats
export const getMentorStats = async (req, res) => {
  try {
    const stats = await Mentor.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalMentors: { $sum: 1 },
                approvedMentors: {
                  $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] }
                },
                pendingMentors: {
                  $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] }
                },
                totalSessions: { $sum: '$stats.totalSessions' },
                avgRating: { $avg: '$stats.rating' }
              }
            }
          ],
          byStatus: [
            {
              $group: {
                _id: '$approvalStatus',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);
    
    const result = {
      ...stats[0].overall[0],
      byStatus: stats[0].byStatus
    };
    
    res.json(result || { 
      totalMentors: 0, 
      approvedMentors: 0,
      pendingMentors: 0,
      totalSessions: 0, 
      avgRating: 0,
      byStatus: []
    });
  } catch (err) {
    console.error('❌ Error in getMentorStats:', err);
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
};

// Get user's own mentor profile
export const getMyMentorProfile = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ user: req.user._id })
      .populate('user', 'name email profile')
      .populate('approvedBy', 'name email')
      .lean();
    
    if (!mentor) {
      return res.status(404).json({ message: 'You do not have a mentor profile' });
    }
    
    res.json(mentor);
  } catch (err) {
    console.error('❌ Error in getMyMentorProfile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};