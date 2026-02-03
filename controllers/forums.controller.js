import Thread from '../models/thread.models.js';

// Get all threads
// Get all threads (SECURE)
export const listThreads = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, sort = 'latest' } = req.query;

    const isAdmin = req.user?.role === 'admin';

    const query = isAdmin ? {} : { status: 'approved' };

    if (category && category !== 'All discussions') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (sort === 'unanswered') {
      query.replies = { $size: 0 };
    }

    const sortOption =
      sort === 'popular'
        ? { views: -1 }
        : { isPinned: -1, lastActivity: -1 };

    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      Thread.find(query)
        .populate('author', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Thread.countDocuments(query)
    ]);

    res.json({
      threads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching threads' });
  }
};



// Get single thread
// Get single thread
export const getThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .lean();

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const isAdmin = req.user?.role === 'admin';

    if (thread.status !== 'approved' && !isAdmin) {
      return res.status(403).json({
        message: 'Thread pending admin approval'
      });
    }

    await Thread.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 }
    });

    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching thread' });
  }
};

export const approveThread = async (req, res) => {
  try {
    const thread = await Thread.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    res.json({ message: 'Thread approved', thread });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed' });
  }
};


// Create thread
// Create thread (pending admin approval)
export const createThread = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        message: 'Title, content, and category are required'
      });
    }

    await Thread.create({
      title: title.trim(),
      content: content.trim(),
      category,
      tags: Array.isArray(tags) ? tags : [],
      author: req.user._id,
      replies: [],
      views: 0,
      isPinned: false,
      isLocked: false,
      status: 'pending', // 🔒
      lastActivity: new Date()
    });

    res.status(201).json({
      message: 'Thread created and awaiting admin approval'
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating thread' });
  }
};

// Add reply
export const replyThread = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const thread = await Thread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    if (thread.status !== 'approved') {
      return res.status(403).json({ message: 'Thread not approved yet' });
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

    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Error posting reply' });
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
    const isAdmin = req.user?.role === 'admin';
    const matchStage = isAdmin ? {} : { status: 'approved' };

    const stats = await Thread.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Thread.countDocuments(matchStage);

    res.json({
      categories: [
        { name: 'All discussions', count: total },
        ...stats.map(s => ({ name: s._id, count: s.count }))
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories' });
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
    res.status(500).json({ message: 'Delete failed' });
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

export const editThread = async (req, res) => {
  try {
    const thread = await Thread.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Edit failed' });
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
