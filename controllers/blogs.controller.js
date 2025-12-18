import Blog from '../models/blog.models.js';
import { paginate } from '../utils/paginate.js';
import { createAdminNotification } from '../utils/createNotification.js';

export const createBlog = async (req, res, next) => {
  try {
    const blog = await Blog.create({ 
      ...req.body, 
      author: req.user._id, 
      status: 'pending' 
    });
    
    // Create notification for admins
    await createAdminNotification({
      type: 'blog',
      title: 'New Blog Submission',
      message: `Article "${blog.title}" is pending review`,
      relatedId: blog._id,
      relatedModel: 'Blog'
    });
    
    res.json(blog);
  } catch (err) {
    next(err);
  }
};

export const listPublished = async (req, res, next) => {
  try {
    const { page = 1, limit = 9, category, search } = req.query;
    
    // Build query
    const query = { status: 'published' };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name email profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Blog.countDocuments(query)
    ]);
    
    res.json({
      blogs,
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

export const getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ 
      _id: req.params.id, 
      status: 'published' 
    }).populate('author', 'name email profile');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (err) { 
    next(err); 
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (!blog.comments) {
      blog.comments = [];
    }

    blog.comments.push({
      user: req.user._id,
      content,
      createdAt: new Date()
    });

    await blog.save();
    
    const populatedBlog = await Blog.findById(blog._id)
      .populate('comments.user', 'name email profile');
    
    res.json(populatedBlog.comments);
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('comments.user', 'name email profile');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json(blog.comments || []);
  } catch (error) {
    next(error);
  }
};

export const likeBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (!blog.likes) {
      blog.likes = [];
    }

    const likeIndex = blog.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      blog.likes.splice(likeIndex, 1);
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();
    res.json(blog);
  } catch (error) {
    next(error);
  }
};

export const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Blog.aggregate([
      { $match: { status: 'published' } },
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
    
    const total = await Blog.countDocuments({ status: 'published' });
    
    const categories = [
      { name: 'All', count: total },
      ...stats.map(s => ({ name: s._id, count: s.count }))
    ];
    
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};