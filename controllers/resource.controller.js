import Resource from '../models/resource.models.js';
import { uploadFileToS3, getSignedS3Url, deleteFilesFromS3, getFileBuffer } from '../utils/wasabi.utils.js';
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
    const {
      title,
      category,
      format,
      tags,
      externalLink,
      description,
      author,
    } = req.body;

    if (!title || !category || !format || !externalLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (format !== 'Link' && format !== 'Video') {
      return res.status(400).json({ error: 'Use upload API for file resources' });
    }

    const resource = await Resource.create({
      title,
      subtitle: `${category} • ${format}`,
      category,
      format,
      tags: Array.isArray(tags) ? tags : [],
      externalLink,
      description,
      author: author || 'Anonymous',
      icon: format === 'Video' ? 'Video' : 'Link2',
    });

    res.status(201).json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        error: 'Missing required fields',
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();

    let format = 'File';
    if (ext === '.pdf') format = 'PDF';
    else if (['.doc', '.docx'].includes(ext)) format = 'DOCX';
    else if (['.mp4', '.avi', '.mov'].includes(ext)) format = 'Video';
    else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) format = 'Images';

    const icon =
      format === 'Video'
        ? 'Video'
        : format === 'Images'
          ? 'Image'
          : 'FileText';

    const { wasabiKey } = await uploadFileToS3(req.file, 'resources');

    const resource = await Resource.create({
      title,
      subtitle: `${category} • ${format}`,
      category,
      format,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      wasabiKey,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      description,
      author: author || 'Anonymous',
      icon,
    });

    res.status(201).json({
      success: true,
      message: 'Resource uploaded successfully',
      resource,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload resource',
      message: error.message,
    });
  }
};

/**
 * View resource - Proxy the file to avoid CORS issues
 */
export const viewResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    // 🔗 External links (Link / Video)
    if (!resource.wasabiKey) {
      return res.json({
        success: true,
        externalLink: resource.externalLink || null,
        type: 'external',
      });
    }

    // 🔥 PDF → ALWAYS PROXY (MOST IMPORTANT FIX)
    if (resource.format === 'PDF' || req.query.proxy === 'true') {
      const { buffer, contentType } = await getFileBuffer(resource.wasabiKey);

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Content-Length': buffer.length,
        'Accept-Ranges': 'bytes',   // 🔥 THIS FIXES CHROME PDF
        'Cache-Control': 'public, max-age=31536000',
      });


      return res.send(buffer);
    }

    // 🖼️ Images / others → signed URL ok
    const url = await getSignedS3Url(resource.wasabiKey, 3600);

    return res.json({
      success: true,
      url,
      type: 'signed',
      format: resource.format,
      mimeType: resource.mimeType,
    });
  } catch (error) {
    console.error('❌ View error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to view resource',
      message: error.message,
    });
  }
};


/**
 * Download resource
 */
export const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || !resource.wasabiKey) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    // Proxy download
    const { buffer, contentType } = await getFileBuffer(resource.wasabiKey);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${resource.title}"`,
      'Content-Length': buffer.length,
    });

    return res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to download resource',
      message: error.message,
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

    if (resource.wasabiKey) {
      await deleteFilesFromS3(resource.wasabiKey);
    }

    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource',
      message: error.message,
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