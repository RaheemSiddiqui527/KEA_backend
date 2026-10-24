import Resource from '../models/resource.models.js';
import ResourceCategory from '../models/resourceCategory.models.js';
import path from 'path';
import fs from 'fs';

// Helper to determine format & icon from file extension
const getFormatAndIcon = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();

  let format = 'File';
  let icon = 'FileText';

  if (ext === '.pdf') {
    format = 'PDF';
    icon = 'FileText';
  } else if (['.doc', '.docx'].includes(ext)) {
    format = 'DOCX';
    icon = 'FileText';
  } else if (['.ppt', '.pptx'].includes(ext)) {
    format = 'File';
    icon = 'FileText';
  } else if (['.xls', '.xlsx'].includes(ext)) {
    format = 'File';
    icon = 'FileText';
  } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
    format = 'Video';
    icon = 'Video';
  } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
    format = 'Images';
    icon = 'Image';
  }

  return { format, icon };
};

/**
 * Get all resources (User and General query)
 */
export const getAllResources = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      search,
      status,
      format,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // For non-admin or public users, only return approved resources
    if (req.user?.role === 'admin' && status && status !== 'all') {
      query.status = status;
    } else if (req.user?.role !== 'admin') {
      query.status = 'approved';
    }

    if (category && category !== 'All resources' && category !== 'all') {
      query.category = category;
    }

    if (subcategory && subcategory !== 'all') {
      query.subcategory = subcategory;
    }

    if (format && format !== 'All Formats' && format !== 'all') {
      query.format = format;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { tags: { $in: [new RegExp(s, 'i')] } },
        { author: { $regex: s, $options: 'i' } },
        { originalFileName: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('submittedBy', 'name email role')
        .populate('folder', 'name subcategories')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Resource.countDocuments(query),
    ]);

    res.json({
      success: true,
      resources,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    console.error('getAllResources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resources',
      message: error.message,
    });
  }
};

/**
 * Get resource by ID
 */
export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('submittedBy', 'name email role')
      .populate('folder', 'name subcategories');

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource',
      message: error.message,
    });
  }
};

/**
 * Create resource (link / video)
 */
export const createResource = async (req, res) => {
  try {
    const {
      title,
      category,
      subcategory,
      format,
      tags,
      externalLink,
      description,
      author,
      status: requestedStatus,
    } = req.body;

    if (!title || !category || !format || !externalLink) {
      return res.status(400).json({ success: false, error: 'Missing required fields (title, category, format, link)' });
    }

    if (format !== 'Link' && format !== 'Video') {
      return res.status(400).json({ success: false, error: 'Use upload API for file resources' });
    }

    const isAdmin = req.user?.role === 'admin';
    const status = isAdmin ? (requestedStatus || 'approved') : 'pending';

    // Find folder if exists
    const folderDoc = await ResourceCategory.findOne({ name: category });

    const resource = await Resource.create({
      title: title.trim(),
      subtitle: `${category} • ${format}`,
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : '',
      folder: folderDoc?._id || undefined,
      format,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      externalLink: externalLink.trim(),
      description: description ? description.trim() : '',
      author: author ? author.trim() : (isAdmin ? 'Admin' : 'Anonymous'),
      icon: format === 'Video' ? 'Video' : 'Link2',
      status,
      submittedBy: req.user?._id,
    });

    res.status(201).json({ success: true, resource, message: 'Resource created successfully' });
  } catch (err) {
    console.error('createResource error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Upload resource(s) - Supports single or multiple files
 */
export const uploadResource = async (req, res) => {
  try {
    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'No file(s) uploaded' });
    }

    const {
      title,
      category,
      subcategory,
      tags,
      description,
      author,
      status: requestedStatus,
    } = req.body;

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Destination folder / category is required',
      });
    }

    const isAdmin = req.user?.role === 'admin';
    const status = isAdmin ? (requestedStatus || 'approved') : 'pending';

    // Find folder if exists or create if missing
    let folderDoc = await ResourceCategory.findOne({ name: category.trim() });
    if (!folderDoc && isAdmin) {
      folderDoc = await ResourceCategory.create({
        name: category.trim(),
        subcategories: subcategory ? [subcategory.trim()] : [],
      });
    } else if (folderDoc && subcategory && !folderDoc.subcategories.includes(subcategory.trim())) {
      folderDoc.subcategories.push(subcategory.trim());
      await folderDoc.save();
    }

    const parsedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);

    const createdResources = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const { format, icon } = getFormatAndIcon(f.originalname);

      // If user supplied a title and there's 1 file, use title; otherwise default to clean file name
      let docTitle = title && files.length === 1
        ? title.trim()
        : path.parse(f.originalname).name.replace(/[-_]/g, ' ');

      const resource = await Resource.create({
        title: docTitle,
        subtitle: `${category.trim()} • ${format}`,
        category: category.trim(),
        subcategory: subcategory ? subcategory.trim() : '',
        folder: folderDoc?._id || undefined,
        format,
        tags: parsedTags,
        filePath: f.path.replace(/\\/g, '/'),
        originalFileName: f.originalname,
        mimeType: f.mimetype,
        fileSize: f.size,
        description: description ? description.trim() : '',
        author: author ? author.trim() : (isAdmin ? 'Admin' : 'Anonymous'),
        icon,
        status,
        submittedBy: req.user?._id,
      });

      createdResources.push(resource);
    }

    res.status(201).json({
      success: true,
      message: `${createdResources.length} document(s) uploaded successfully`,
      resource: createdResources[0],
      resources: createdResources,
    });
  } catch (error) {
    console.error('uploadResource error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload resource',
      message: error.message,
    });
  }
};

/**
 * View resource (Streams file inline for browser or returns JSON if requested)
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

    // External link
    if (!resource.filePath && !resource.wasabiKey) {
      if (resource.externalLink) {
        return res.redirect(resource.externalLink);
      }
      return res.status(400).json({ success: false, error: 'No link or file found for this resource' });
    }

    // Local file handling
    if (resource.filePath) {
      const fullPath = path.resolve(resource.filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, error: 'File not found on storage server' });
      }

      const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
      const wantsJson = req.query.json === 'true' || acceptsJson;

      if (wantsJson && req.query.stream !== 'true') {
        const protocol = req.protocol;
        const host = req.get('host');
        const url = `${protocol}://${host}/${resource.filePath}`;

        return res.json({
          success: true,
          url,
          type: 'local',
          format: resource.format,
          mimeType: resource.mimeType,
          originalFileName: resource.originalFileName || resource.title,
        });
      }

      // Stream file directly to browser (PDF, images, etc.)
      res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(resource.originalFileName || resource.title + path.extname(resource.filePath))}"`
      );
      return res.sendFile(fullPath);
    }

    return res.status(400).json({ success: false, error: 'No file found for this resource' });
  } catch (error) {
    console.error('viewResource error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to view resource',
      message: error.message,
    });
  }
};

/**
 * Download resource (Direct download with proper filename)
 */
export const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    if (resource.filePath) {
      const fullPath = path.resolve(resource.filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          success: false,
          error: 'File does not exist on storage server',
        });
      }

      const downloadName = resource.originalFileName || `${resource.title}${path.extname(resource.filePath)}`;
      return res.download(fullPath, downloadName);
    }

    if (resource.externalLink) {
      return res.redirect(resource.externalLink);
    }

    return res.status(404).json({ success: false, error: 'No file available for download' });
  } catch (error) {
    console.error('downloadResource error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download resource',
      message: error.message,
    });
  }
};

/**
 * Update resource metadata or replace file
 */
export const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    const {
      title,
      category,
      subcategory,
      tags,
      description,
      author,
      format,
      status,
      externalLink,
    } = req.body;

    if (title) resource.title = title.trim();
    if (category) resource.category = category.trim();
    if (subcategory !== undefined) resource.subcategory = subcategory ? subcategory.trim() : '';
    if (description !== undefined) resource.description = description.trim();
    if (author) resource.author = author.trim();
    if (format) resource.format = format;
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      resource.status = status;
    }
    if (externalLink) resource.externalLink = externalLink.trim();

    if (tags !== undefined) {
      resource.tags = Array.isArray(tags)
        ? tags
        : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    // If replacement file uploaded
    if (req.file) {
      // Remove old file if exists
      if (resource.filePath && fs.existsSync(resource.filePath)) {
        try {
          fs.unlinkSync(resource.filePath);
        } catch (e) {
          console.warn('Failed to delete old file during replace:', e);
        }
      }

      const { format: newFormat, icon: newIcon } = getFormatAndIcon(req.file.originalname);
      resource.filePath = req.file.path.replace(/\\/g, '/');
      resource.originalFileName = req.file.originalname;
      resource.fileSize = req.file.size;
      resource.mimeType = req.file.mimetype;
      resource.format = newFormat;
      resource.icon = newIcon;
    }

    // Sync folder ID
    if (category) {
      const folderDoc = await ResourceCategory.findOne({ name: resource.category });
      if (folderDoc) {
        resource.folder = folderDoc._id;
      }
    }

    await resource.save();

    res.json({
      success: true,
      message: 'Resource updated successfully',
      resource,
    });
  } catch (error) {
    console.error('updateResource error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource',
      message: error.message,
    });
  }
};

/**
 * Delete resource and clean up disk file
 */
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    // Clean up local disk file
    if (resource.filePath && fs.existsSync(resource.filePath)) {
      try {
        fs.unlinkSync(resource.filePath);
      } catch (err) {
        console.warn('Error deleting physical file:', err);
      }
    }

    await resource.deleteOne();

    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('deleteResource error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource',
      message: error.message,
    });
  }
};

/**
 * Category stats for Knowledge Hub filters
 */
export const getCategoryStats = async (req, res) => {
  try {
    const matchStage = { status: 'approved' };

    const stats = await Resource.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Resource.countDocuments(matchStage);

    res.json({
      success: true,
      categories: [
        { name: 'All resources', count: total },
        ...stats.map(s => ({
          name: s._id || 'Uncategorized',
          count: s.count,
        })),
      ],
    });
  } catch (error) {
    console.error('getCategoryStats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category statistics',
      message: error.message,
    });
  }
};
