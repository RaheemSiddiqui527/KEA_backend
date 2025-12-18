import Thread from '../models/thread.models.js';

// Get all threads
export const listThreads = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, sort = 'latest' } = req.query;
    
    const query = {};
    
    if (category && category !== 'All discussions') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = { lastActivity: -1 };
    
    if (sort === 'popular') {
      sortOption = { views: -1 };
    } else if (sort === 'unanswered') {
      query.replies = { $size: 0 };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const threads = await Thread.find(query)
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Thread.countDocuments(query);
    
    res.json({
      threads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Error in listThreads:', err);
    res.status(500).json({ 
      message: 'Error fetching threads', 
      error: err.message 
    });
  }
};

// Get single thread
export const getThread = async (req, res) => {
  try {
    console.log('📝 Fetching thread:', req.params.id);
    
    const thread = await Thread.findById(req.params.id)
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .lean();
    
    if (!thread) {
      console.log('❌ Thread not found:', req.params.id);
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    console.log('✅ Thread found:', thread.title);
    
    // Increment views (do this separately to avoid issues)
    await Thread.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 }
    });
    
    res.json(thread);
  } catch (err) {
    console.error('❌ Error in getThread:', err);
    res.status(500).json({ 
      message: 'Error fetching thread', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Create thread
export const createThread = async (req, res) => {
  try {
    console.log('📝 Creating thread:', req.body);
    
    const { title, content, category, tags } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ 
        message: 'Title, content, and category are required' 
      });
    }
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const thread = new Thread({
      title: title.trim(),
      content: content.trim(),
      category,
      tags: Array.isArray(tags) ? tags : [],
      author: req.user._id,
      replies: [],
      views: 0,
      isPinned: false,
      isLocked: false,
      lastActivity: new Date()
    });
    
    await thread.save();
    
    const populatedThread = await Thread.findById(thread._id)
      .populate('author', 'name email')
      .lean();
    
    console.log('✅ Thread created:', populatedThread._id);
    
    res.status(201).json(populatedThread);
  } catch (err) {
    console.error('❌ Error in createThread:', err);
    res.status(500).json({ 
      message: 'Error creating thread', 
      error: err.message 
    });
  }
};

// Add reply
export const replyThread = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const thread = await Thread.findById(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    if (thread.isLocked) {
      return res.status(403).json({ message: 'Thread is locked' });
    }
    
    thread.replies.push({
      author: req.user._id,
      content: content.trim(),
      likes: [],
      createdAt: new Date()
    });
    
    thread.lastActivity = new Date();
    await thread.save();
    
    const updatedThread = await Thread.findById(thread._id)
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .lean();
    
    res.json(updatedThread);
  } catch (err) {
    console.error('❌ Error in replyThread:', err);
    res.status(500).json({ 
      message: 'Error posting reply', 
      error: err.message 
    });
  }
};

// Like reply
export const likeReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const thread = await Thread.findById(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    const reply = thread.replies.id(replyId);
    
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    const userIdString = req.user._id.toString();
    const likeIndex = reply.likes.findIndex(
      id => id.toString() === userIdString
    );
    
    if (likeIndex > -1) {
      reply.likes.splice(likeIndex, 1);
    } else {
      reply.likes.push(req.user._id);
    }
    
    await thread.save();
    
    const updatedThread = await Thread.findById(thread._id)
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .lean();
    
    res.json(updatedThread);
  } catch (err) {
    console.error('❌ Error in likeReply:', err);
    res.status(500).json({ 
      message: 'Error liking reply', 
      error: err.message 
    });
  }
};

// Get category stats
export const getCategoryStats = async (req, res) => {
  try {
    const stats = await Thread.aggregate([
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
    
    const total = await Thread.countDocuments();
    
    const categories = [
      { name: 'All discussions', count: total },
      ...stats.map(s => ({ name: s._id, count: s.count }))
    ];
    
    res.json({ categories });
  } catch (err) {
    console.error('❌ Error in getCategoryStats:', err);
    res.status(500).json({ 
      message: 'Error fetching categories', 
      error: err.message 
    });
  }
};

// Delete thread
export const deleteThread = async (req, res) => {
  try {
    const thread = await Thread.findByIdAndDelete(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    res.json({ message: 'Thread deleted successfully' });
  } catch (err) {
    console.error('❌ Error in deleteThread:', err);
    res.status(500).json({ 
      message: 'Error deleting thread', 
      error: err.message 
    });
  }
};

// Pin thread
export const togglePinThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    thread.isPinned = !thread.isPinned;
    await thread.save();
    
    res.json(thread);
  } catch (err) {
    console.error('❌ Error in togglePinThread:', err);
    res.status(500).json({ 
      message: 'Error pinning thread', 
      error: err.message 
    });
  }
};

// Lock thread
export const toggleLockThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    thread.isLocked = !thread.isLocked;
    await thread.save();
    
    res.json(thread);
  } catch (err) {
    console.error('❌ Error in toggleLockThread:', err);
    res.status(500).json({ 
      message: 'Error locking thread', 
      error: err.message 
    });
  }
};
