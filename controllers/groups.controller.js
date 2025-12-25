import mongoose from 'mongoose';
import Group from '../models/group.models.js';

// Get all groups with filters (only approved or default groups)
export const listGroups = async (req, res) => {
  try {
    const { category, search, type, page = 1, limit = 12 } = req.query;
    
    // Only show approved groups or default groups
    const query = {
      $or: [
        { isApproved: true },
        { isDefault: true }
      ],
      isActive: true
    };
    
    if (category && category !== 'All groups') {
      query.category = category;
    }
    
    if (type && type !== 'all') {
      query.type = type.toLowerCase();
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { discipline: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const groups = await Group.find(query)
      .populate('creator', 'name email')
      .sort({ isDefault: -1, createdAt: -1 }) // Show default groups first
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Group.countDocuments(query);
    
    // Add member count
    const groupsWithCount = groups.map(group => ({
      ...group,
      memberCount: group.members?.length || 0,
      postCount: group.posts?.length || 0
    }));
    
    res.json({
      groups: groupsWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Error in listGroups:', err);
    res.status(500).json({ message: 'Error fetching groups', error: err.message });
  }
};

// Get single group
// Get single group
// Get single group
export const getGroup = async (req, res) => {
  try {
    // ✅ Validate ID parameter
    const groupId = req.params.id;
    
    if (!groupId || groupId === 'undefined' || groupId === 'null') {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    // ✅ Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID format' });
    }

    const group = await Group.findById(groupId)
      .populate('creator', 'name email profile')
      .populate('members.user', 'name email profile')
      .populate('posts.author', 'name email profile')
      .populate('posts.comments.author', 'name email profile')
      .lean();
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // ✅ Check if group is approved (unless it's default group)
    if (!group.isApproved && !group.isDefault) {
      // ✅ Allow creator and admins to view pending groups
      const isCreator = group.creator._id.toString() === req.user?._id?.toString();
      const isAdmin = req.user?.role === 'admin';
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({ 
          message: 'This group is pending approval',
          approvalStatus: group.approvalStatus 
        });
      }
    }

    // ✅ Check if group is active
    if (!group.isActive && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'This group is not active' });
    }
    
    res.json(group);
  } catch (err) {
    console.error('❌ Error in getGroup:', err);
    res.status(500).json({ message: 'Error fetching group', error: err.message });
  }
};
// Create group (ADMIN ONLY - or request system)
// Create group (ADMIN ONLY - or request system)
export const createGroup = async (req, res) => {
  try {
    const { name, description, category, type, discipline, region, requestReason, estimatedMembers } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Group description is required' });
    }

    // Check if user is admin
    const isAdmin = req.user.role === 'admin';

    const groupData = {
      name: name.trim(),
      description: description.trim(),
      category: category || 'General',
      type: type || 'public',
      discipline: discipline?.trim() || '',
      region: region?.trim() || '',
      creator: req.user._id,
      admins: [req.user._id],
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }],
      posts: [],
      resources: [],
      
      // Approval fields
      isDefault: false,
      isApproved: isAdmin, // Auto-approve for admin
      approvalStatus: isAdmin ? 'approved' : 'pending',
      isActive: isAdmin, // Active only if admin created
      
      // Request fields (if user-created)
      ...((!isAdmin && requestReason) && { requestReason }),
      ...((!isAdmin && estimatedMembers) && { estimatedMembers })
    };

    // If admin created, add approval details
    if (isAdmin) {
      groupData.approvedBy = req.user._id;
      groupData.approvedAt = new Date();
    }
    
    const group = new Group(groupData);
    await group.save();
    
    // ✅ Populate creator for response
    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email profile')
      .lean();
    
    console.log('✅ Group created successfully:', populatedGroup._id);
    
    // ✅ IMPORTANT: Return group object with _id
    if (isAdmin) {
      res.status(201).json({
        message: 'Group created successfully!',
        group: populatedGroup
      });
    } else {
      res.status(201).json({
        message: 'Group request submitted! It will be reviewed by administrators.',
        group: populatedGroup
      });
    }
  } catch (err) {
    console.error('❌ Error in createGroup:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Error creating group', error: err.message });
  }
};
// Admin: Get all groups (including pending)
export const getAllGroupsAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.approvalStatus = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const groups = await Group.find(query)
      .populate('creator', 'name email profile')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Group.countDocuments(query);
    
    // Get counts for each status
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
      }, {})
    });
  } catch (err) {
    console.error('❌ Error in getAllGroupsAdmin:', err);
    res.status(500).json({ message: 'Error fetching groups', error: err.message });
  }
};

// Admin: Approve group
export const approveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
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
      .populate('approvedBy', 'name email')
      .lean();
    
    res.json({
      message: 'Group approved successfully',
      group: updatedGroup
    });
  } catch (err) {
    console.error('❌ Error in approveGroup:', err);
    res.status(500).json({ message: 'Error approving group', error: err.message });
  }
};

// Admin: Reject group
export const rejectGroup = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
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
      .populate('approvedBy', 'name email')
      .lean();
    
    res.json({
      message: 'Group rejected',
      group: updatedGroup
    });
  } catch (err) {
    console.error('❌ Error in rejectGroup:', err);
    res.status(500).json({ message: 'Error rejecting group', error: err.message });
  }
};

// Join group - FIXED VERSION
export const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if group is approved
    if (!group.isApproved && !group.isDefault) {
      return res.status(403).json({ message: 'This group is not available yet' });
    }
    
    // Check if already a member
    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    
    if (isMember) {
      return res.status(400).json({ message: 'Already a member' });
    }
    
    // Use findByIdAndUpdate to avoid validation issues
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          members: {
            user: req.user._id,
            role: 'member',
            joinedAt: new Date()
          }
        }
      },
      { 
        new: true,
        runValidators: false  // ✅ Skip validation on update
      }
    )
    .populate('creator', 'name email')
    .populate('members.user', 'name email')
    .lean();
    
    res.json(updatedGroup);
  } catch (err) {
    console.error('❌ Error in joinGroup:', err);
    res.status(500).json({ message: 'Error joining group', error: err.message });
  }
};

// Leave group - FIXED VERSION
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Don't allow creator to leave
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Group creator cannot leave' });
    }
    
    // Use findByIdAndUpdate to avoid validation issues
    await Group.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          members: { user: req.user._id }
        }
      },
      { 
        runValidators: false  // ✅ Skip validation on update
      }
    );
    
    res.json({ message: 'Left group successfully' });
  } catch (err) {
    console.error('❌ Error in leaveGroup:', err);
    res.status(500).json({ message: 'Error leaving group', error: err.message });
  }
};

// Create post in group
export const createPost = async (req, res) => {
  try {
    const { content, attachments } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is a member
    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Must be a member to post' });
    }
    
    group.posts.push({
      author: req.user._id,
      content: content.trim(),
      attachments: attachments || [],
      likes: [],
      comments: [],
      createdAt: new Date()
    });
    
    await group.save();
    
    const updatedGroup = await Group.findById(group._id)
      .populate('posts.author', 'name email profile')
      .lean();
    
    res.json(updatedGroup);
  } catch (err) {
    console.error('❌ Error in createPost:', err);
    res.status(500).json({ message: 'Error creating post', error: err.message });
  }
};

// Like post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    const post = group.posts.id(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const likeIndex = post.likes.findIndex(
      id => id.toString() === req.user._id.toString()
    );
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user._id);
    }
    
    await group.save();
    res.json(group);
  } catch (err) {
    console.error('❌ Error in likePost:', err);
    res.status(500).json({ message: 'Error liking post', error: err.message });
  }
};

// Comment on post
export const commentPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    const post = group.posts.id(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    post.comments.push({
      author: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    });
    
    await group.save();
    
    const updatedGroup = await Group.findById(group._id)
      .populate('posts.comments.author', 'name email profile')
      .lean();
    
    res.json(updatedGroup);
  } catch (err) {
    console.error('❌ Error in commentPost:', err);
    res.status(500).json({ message: 'Error commenting', error: err.message });
  }
};

// Get category stats
export const getCategoryStats = async (req, res) => {
  try {
    const stats = await Group.aggregate([
      {
        $match: {
          $or: [
            { isApproved: true },
            { isDefault: true }
          ],
          isActive: true
        }
      },
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
    
    const total = await Group.countDocuments({
      $or: [
        { isApproved: true },
        { isDefault: true }
      ],
      isActive: true
    });
    
    const categories = [
      { name: 'All groups', count: total },
      ...stats.map(s => ({ name: s._id, count: s.count }))
    ];
    
    res.json({ categories });
  } catch (err) {
    console.error('❌ Error in getCategoryStats:', err);
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
};