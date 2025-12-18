import Resource from '../models/resource.models.js';
import fs from 'fs';
import path from 'path';

/**
 * Get all resources
 */
export const getAllResources = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 9,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    if (category && category !== 'All resources') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const resources = await Resource.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Resource.countDocuments(query);

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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resources',
      message: error.message
    });
  }
};

/**
 * Get resource by ID
 */
export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource',
      message: error.message
    });
  }
};

/**
 * Create resource (link)
 */
export const createResource = async (req, res) => {
  try {
    const { title, category, format, tags, link, description, author, subtitle } =
      req.body;

    if (!title || !category || !format || !link) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    let icon = 'FileText';
    if (format === 'Video') icon = 'Video';
    else if (format === 'Link') icon = 'Link2';
    else if (format === 'Images') icon = 'Image';

    const resource = await Resource.create({
      title,
      subtitle: subtitle || `${category} • ${format}`,
      category,
      format,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      link,
      description,
      author: author || 'Anonymous',
      icon
    });

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create resource',
      message: error.message
    });
  }
};

/**
 * Upload resource
 */
export const uploadResource = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { title, category, tags, description, author } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();

    let format = 'File';
    if (ext === '.pdf') format = 'PDF';
    else if (['.doc', '.docx'].includes(ext)) format = 'DOCX';
    else if (['.mp4', '.avi', '.mov'].includes(ext)) format = 'Video';
    else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) format = 'Images';

    let icon = format === 'Video' ? 'Video' : format === 'Images' ? 'Image' : 'FileText';

    const resource = await Resource.create({
      title,
      subtitle: `${category} • ${format} • ${(req.file.size / 1024).toFixed(1)} KB`,
      category,
      format,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      link: `/uploads/${req.file.filename}`,
      filePath: req.file.path,
      fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
      description,
      author: author || 'Anonymous',
      icon
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error.message
    });
  }
};

/**
 * Update resource
 */
export const updateResource = async (req, res) => {
  try {
    const updates = req.body;

    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    res.json({
      success: true,
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update resource',
      message: error.message
    });
  }
};

/**
 * Delete resource
 */
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    if (resource.filePath && fs.existsSync(resource.filePath)) {
      fs.unlinkSync(resource.filePath);
    }

    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource',
      message: error.message
    });
  }
};

/**
 * Category stats
 */
export const getCategoryStats = async (req, res) => {
  try {
    const stats = await Resource.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const total = await Resource.countDocuments();

    res.json({
      success: true,
      categories: [
        { name: 'All resources', count: total },
        ...stats.map(s => ({ name: s._id, count: s.count }))
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category statistics',
      message: error.message
    });
  }
};
