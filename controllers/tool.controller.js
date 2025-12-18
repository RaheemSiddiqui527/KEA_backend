import Tool from '../models/tool.models.js';

// Get all tools
export const getAllTools = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
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
  } catch (error) {
    next(error);
  }
};

// Get tool by ID
export const getToolById = async (req, res, next) => {
  try {
    const tool = await Tool.findById(req.params.id);
    
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    
    res.json(tool);
  } catch (error) {
    next(error);
  }
};

// Create tool
export const createTool = async (req, res, next) => {
  try {
    const toolData = {
      ...req.body,
      addedBy: req.user._id
    };
    
    const tool = await Tool.create(toolData);
    res.status(201).json(tool);
  } catch (error) {
    next(error);
  }
};

// Update tool
export const updateTool = async (req, res, next) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    
    res.json(tool);
  } catch (error) {
    next(error);
  }
};

// Delete tool
export const deleteTool = async (req, res, next) => {
  try {
    const tool = await Tool.findByIdAndDelete(req.params.id);
    
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    
    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get category stats
export const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Tool.aggregate([
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
    
    const total = await Tool.countDocuments();
    
    const categories = [
      { name: 'All tools', count: total },
      ...stats.map(s => ({ name: s._id, count: s.count }))
    ];
    
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

// Increment download count
export const incrementDownloads = async (req, res, next) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    
    res.json(tool);
  } catch (error) {
    next(error);
  }
};