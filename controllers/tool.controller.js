import Tool from '../models/tool.models.js';

// Get all tools
export const getAllTools = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;

    const query = {
      isApproved: true // 🔒 DEFAULT: only approved
    };

    // Admin can see everything
    if (req.user?.role === 'admin') {
      delete query.isApproved;
    }

    if (category && category !== 'All tools') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [tools, total] = await Promise.all([
      Tool.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Tool.countDocuments(query)
    ]);

    res.json({
      tools,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
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
// Create tool (pending admin approval)
export const createTool = async (req, res, next) => {
  try {
    const toolData = {
      ...req.body,
      addedBy: req.user._id,
      isApproved: false // 🔒 IMPORTANT
    };

    const tool = await Tool.create(toolData);

    // (Optional) Notify admin
    await createAdminNotification({
      type: 'tool',
      title: 'New Tool Added',
      message: `"${tool.name}" is pending approval`,
      relatedId: tool._id,
      relatedModel: 'Tool'
    });

    // ⚠️ Do NOT expose tool data publicly
    res.status(201).json({
      message: 'Tool created and awaiting admin approval'
    });
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

// Get category stats (SECURE)
export const getCategoryStats = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';

    // 🔒 Default filter
    const matchStage = isAdmin
      ? {} // admin sees all
      : { isApproved: true }; // public sees approved only

    const stats = await Tool.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = await Tool.countDocuments(matchStage);

    const categories = [
      { name: 'All tools', count: total },
      ...stats.map(s => ({
        name: s._id,
        count: s.count
      }))
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