import Group from '../models/group.models.js';

// Get all groups with filters
export const listGroups = async (req, res) => {
  try {
    const { category, search, type, page = 1, limit = 12 } = req.query;
    
    const query = {};
    
    if (category && category !== 'All groups') {
      query.category = category;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const groups = await Group.find(query)
      .populate('creator', 'name email')
      .sort({ createdAt: -1 })
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
export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name email profile')
      .populate('members.user', 'name email profile')
      .populate('posts.author', 'name email profile')
      .populate('posts.comments.author', 'name email profile')
      .lean();
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    res.json(group);
  } catch (err) {
    console.error('❌ Error in getGroup:', err);
    res.status(500).json({ message: 'Error fetching group', error: err.message });
  }
};

// Create group
export const createGroup = async (req, res) => {
  try {
    const { name, description, category, type, discipline, region } = req.body;
    
    if (!name || !description || !category) {
      return res.status(400).json({ 
        message: 'Name, description, and category are required' 
      });
    }
    
    const group = new Group({
      name: name.trim(),
      description: description.trim(),
      category,
      type: type || 'public',
      discipline,
      region,
      creator: req.user._id,
      admins: [req.user._id],
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }],
      posts: [],
      resources: []
    });
    
    await group.save();
    
    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email')
      .lean();
    
    res.status(201).json(populatedGroup);
  } catch (err) {
    console.error('❌ Error in createGroup:', err);
    res.status(500).json({ message: 'Error creating group', error: err.message });
  }
};

// Join group - FIXED VERSION
export const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
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
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await Group.countDocuments();
    
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