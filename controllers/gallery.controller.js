import Gallery from '../models/gallery.models.js';
import { createAdminNotification } from '../utils/createNotification.js';

// Get all gallery items
export const listGallery = async (req, res) => {
  try {
    const { category, search, year, page = 1, limit = 12 } = req.query;
    
    const query = { isApproved: true };
    
    if (category && category !== 'All photos') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
      query.createdAt = { $gte: startOfYear, $lte: endOfYear };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const items = await Gallery.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Gallery.countDocuments(query);
    
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
    console.error('❌ Error in listGallery:', err);
    res.status(500).json({ message: 'Error fetching gallery', error: err.message });
  }
};

// Get single gallery item
export const getGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'name email profile')
      .populate('comments.user', 'name email')
      .lean();
    
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    
    res.json(item);
  } catch (err) {
    console.error('❌ Error in getGalleryItem:', err);
    res.status(500).json({ message: 'Error fetching gallery item', error: err.message });
  }
};

// Upload gallery item
export const uploadGalleryItem = async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      uploadedBy: req.user._id,
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
      isApproved: false
    };
    
    const item = await Gallery.create(itemData);
    
    // Notify admins
    await createAdminNotification({
      type: 'gallery',
      title: 'New Gallery Upload',
      message: `${item.title} is pending approval`,
      relatedId: item._id,
      relatedModel: 'Gallery'
    });
    
    res.status(201).json(item);
  } catch (err) {
    console.error('❌ Error in uploadGalleryItem:', err);
    res.status(500).json({ message: 'Error uploading item', error: err.message });
  }
};

// Like gallery item
export const likeGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    
    const likeIndex = item.likes.findIndex(
      id => id.toString() === req.user._id.toString()
    );
    
    if (likeIndex > -1) {
      item.likes.splice(likeIndex, 1);
    } else {
      item.likes.push(req.user._id);
    }
    
    await item.save();
    res.json(item);
  } catch (err) {
    console.error('❌ Error in likeGalleryItem:', err);
    res.status(500).json({ message: 'Error liking item', error: err.message });
  }
};

// Comment on gallery item
export const commentGalleryItem = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const item = await Gallery.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user: req.user._id,
            content: content.trim(),
            createdAt: new Date()
          }
        }
      },
      { new: true, runValidators: false }
    )
    .populate('uploadedBy', 'name email')
    .populate('comments.user', 'name email');
    
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    
    res.json(item);
  } catch (err) {
    console.error('❌ Error in commentGalleryItem:', err);
    res.status(500).json({ message: 'Error commenting', error: err.message });
  }
};

// Delete gallery item
export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findOne({ 
      _id: req.params.id, 
      uploadedBy: req.user._id 
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found or unauthorized' });
    }
    
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gallery item deleted successfully' });
  } catch (err) {
    console.error('❌ Error in deleteGalleryItem:', err);
    res.status(500).json({ message: 'Error deleting item', error: err.message });
  }
};

// Get category stats
export const getCategoryStats = async (req, res) => {
  try {
    const stats = await Gallery.aggregate([
      { $match: { isApproved: true } },
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
    
    const total = await Gallery.countDocuments({ isApproved: true });
    
    const categories = [
      { name: 'All photos', count: total },
      ...stats.map(s => ({ name: s._id, count: s.count }))
    ];
    
    res.json({ categories });
  } catch (err) {
    console.error('❌ Error in getCategoryStats:', err);
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
};