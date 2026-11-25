import Resource from '../models/resource.models.js';
import ResourceCategory from '../models/resourceCategory.models.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to extract clean relative upload path from any path variant (relative, absolute Linux, or absolute Windows)
export const getNormalizedRelativeUploadPath = (filePath) => {
  if (!filePath) return null;
  const match = filePath.match(/(?:^|[/\\])(uploads[/\\][\s\S]+)$/i);
  if (match) {
    return match[1].replace(/\\/g, '/');
  }
  return filePath.replace(/\\/g, '/').replace(/^\/+/, '');
};

// Helper to reliably find physical file on disk across CWDs
const getExistingFilePath = (filePath) => {
  if (!filePath) return null;
  const cleanRelative = getNormalizedRelativeUploadPath(filePath);

  // 1. Direct path check if exists
  if (fs.existsSync(filePath)) {
    return path.resolve(filePath);
  }

  // 2. Base uploads folder check by filename (Handles files uploaded on any OS/server, Linux /home/escape/... or Windows)
  const baseName = path.basename(filePath);
  const candidateDocs = path.resolve(__dirname, '../uploads/documents', baseName);
  if (fs.existsSync(candidateDocs)) return candidateDocs;

  const candidateUploads = path.resolve(__dirname, '../uploads', baseName);
  if (fs.existsSync(candidateUploads)) return candidateUploads;

  // 3. Relative to __dirname (controllers) -> ..
  if (cleanRelative) {
    const candidateBehindDir = path.resolve(__dirname, '..', cleanRelative);
    if (fs.existsSync(candidateBehindDir)) return candidateBehindDir;

    const candidateCwd = path.resolve(process.cwd(), cleanRelative);
    if (fs.existsSync(candidateCwd)) return candidateCwd;

    const candidateRelative = path.resolve(cleanRelative);
    if (fs.existsSync(candidateRelative)) return candidateRelative;
  }

  return null;
};

// Helper to reliably find or auto-sync physical file on disk
const ensurePhysicalFile = async (filePath) => {
  const existing = getExistingFilePath(filePath);
  if (existing) return existing;

  const cleanRelative = getNormalizedRelativeUploadPath(filePath);
  if (!cleanRelative) return null;

  // Fallback: If running in local dev connected to production MongoDB Atlas, auto-sync from production storage
  try {
    const remoteUrl = `https://api.kokaniengineers.org/${cleanRelative}`;
    const remoteRes = await fetch(remoteUrl);
    if (remoteRes.ok) {
      const buffer = await remoteRes.arrayBuffer();
      const localDest = path.resolve(__dirname, '..', cleanRelative);
      fs.mkdirSync(path.dirname(localDest), { recursive: true });
      fs.writeFileSync(localDest, Buffer.from(buffer));
      return localDest;
    }
  } catch (err) {
    // remote sync failed
  }
  return null;
};

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
  } else if (['.xls', '.xlsx', '.csv'].includes(ext)) {
    format = 'File';
    icon = 'FileText';
  } else if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
    format = 'Video';
    icon = 'Video';
  } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
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
    const isAdminUser = req.user?.role === 'admin' || req.user?.role === 'superadmin';

    // For non-admin or public users, only return approved resources
    if (isAdminUser && status && status !== 'all') {
      query.status = status;
    } else if (!isAdminUser) {
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

    if (!title || !category || !externalLink) {
      return res.status(400).json({ success: false, error: 'Missing required fields (title, category, link)' });
    }

    const resolvedFormat = format?.toLowerCase() === 'video' ? 'Video' : 'Link';

    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    const status = isAdmin ? (requestedStatus || 'approved') : 'pending';

    // Find folder if exists (case-insensitive)
    const escapedCategory = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const folderDoc = await ResourceCategory.findOne({
      name: { $regex: new RegExp(`^${escapedCategory}$`, 'i') }
    });

    const resource = await Resource.create({
      title: title.trim(),
      subtitle: `${category} • ${resolvedFormat}`,
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : '',
      folder: folderDoc?._id || undefined,
      format: resolvedFormat,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      externalLink: externalLink.trim(),
      description: description ? description.trim() : '',
      author: author ? author.trim() : (isAdmin ? 'Admin' : 'Anonymous'),
      icon: resolvedFormat === 'Video' ? 'Video' : 'Link2',
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
      if (req.skippedUploadFiles && req.skippedUploadFiles.length > 0) {
        const skippedNames = req.skippedUploadFiles.map((f) => `"${f.originalname}"`).join(', ');
        return res.status(400).json({
          success: false,
          error: `Unsupported file type for ${skippedNames}. Supported formats: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), Excel/CSV (XLS/XLSX/CSV), Text (TXT/RTF), Images (JPG/PNG/WEBP/GIF/SVG), and Videos (MP4/MOV/AVI/MKV/WEBM).`,
          message: `Unsupported file type for ${skippedNames}.`,
        });
      }
      return res.status(400).json({ success: false, error: 'No file(s) uploaded', message: 'No file(s) uploaded' });
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
        message: 'Destination folder / category is required',
      });
    }

    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    const status = isAdmin ? (requestedStatus || 'approved') : 'pending';

    // Find folder if exists (case-insensitive) or create if missing for admin
    const escapedCategory = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let folderDoc = await ResourceCategory.findOne({
      name: { $regex: new RegExp(`^${escapedCategory}$`, 'i') }
    });

    if (!folderDoc && isAdmin) {
      folderDoc = await ResourceCategory.create({
        name: category.trim(),
        subcategories: subcategory ? [subcategory.trim()] : [],
      });
    } else if (folderDoc && subcategory) {
      if (!Array.isArray(folderDoc.subcategories)) {
        folderDoc.subcategories = [];
      }
      const trimmedSub = subcategory.trim();
      const subExists = folderDoc.subcategories.some(
        s => s.toLowerCase() === trimmedSub.toLowerCase()
      );
      if (!subExists) {
        folderDoc.subcategories.push(trimmedSub);
        await folderDoc.save();
      }
    }

    const parsedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);

    const createdResources = [];
    const uploadErrors = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const { format, icon } = getFormatAndIcon(f.originalname);

        // If user supplied a title and there's exactly 1 file, use that title; otherwise use clean file name
        let docTitle = title && files.length === 1
          ? title.trim()
          : path.parse(f.originalname).name.replace(/[-_]/g, ' ').trim();
        if (!docTitle) {
          docTitle = f.originalname;
        }

        const normalizedFilePath = f.path.replace(/\\/g, '/');

        const resource = await Resource.create({
          title: docTitle,
          subtitle: `${category.trim()} • ${format}`,
          category: category.trim(),
          subcategory: subcategory ? subcategory.trim() : '',
          folder: folderDoc?._id || undefined,
          format,
          tags: parsedTags,
          filePath: normalizedFilePath,
          originalFileName: f.originalname,
          mimeType: f.mimetype || 'application/octet-stream',
          fileSize: f.size,
          description: description ? description.trim() : '',
          author: author ? author.trim() : (isAdmin ? 'Admin' : 'Anonymous'),
          icon,
          status,
          submittedBy: req.user?._id,
        });

        createdResources.push(resource);
      } catch (fileErr) {
        console.error(`Failed to create resource document for "${f.originalname}":`, fileErr);
        // Clean up physical file on error
        if (f.path && fs.existsSync(f.path)) {
          try { fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
        }
        uploadErrors.push({
          fileName: f.originalname,
          error: fileErr.message
        });
      }
    }

    if (createdResources.length === 0 && uploadErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to upload document(s)',
        message: uploadErrors.map(e => `${e.fileName}: ${e.error}`).join('; '),
        errors: uploadErrors
      });
    }

    const skippedNotice = req.skippedUploadFiles && req.skippedUploadFiles.length > 0
      ? ` (${req.skippedUploadFiles.length} unsupported file(s) skipped)`
      : '';

    res.status(201).json({
      success: true,
      message: `${createdResources.length} document(s) uploaded successfully${uploadErrors.length > 0 ? ` (${uploadErrors.length} failed)` : ''}${skippedNotice}`,
      resource: createdResources[0],
      resources: createdResources,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined,
      skipped: req.skippedUploadFiles && req.skippedUploadFiles.length > 0 ? req.skippedUploadFiles : undefined,
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

    // Set headers explicitly to allow iframe embedding across all live domains
    res.removeHeader('X-Frame-Options');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://admin.kokaniengineers.org https://kokaniengineers.org https://*.kokaniengineers.org https://*.vercel.app https://*.nexcorealliance.com http://localhost:* http://127.0.0.1:*;"
    );

    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
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
      const cleanRelative = getNormalizedRelativeUploadPath(resource.filePath);
      const fullPath = await ensurePhysicalFile(resource.filePath);

      if (!fullPath) {
        // Prevent infinite redirect loop when running on api.kokaniengineers.org
        const host = req.get('host') || '';
        const isAlreadyOnRemote = host.includes('kokaniengineers.org');

        if (!isAlreadyOnRemote) {
          return res.redirect(`https://api.kokaniengineers.org/api/resources/${resource._id}/view`);
        }

        // On production, if physical file is missing from disk:
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(404).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>File Not Found</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; text-align: center; }
    .card { background: #1e293b; padding: 40px; border-radius: 16px; border: 1px solid #334155; max-width: 450px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
    h2 { margin-top: 0; color: #f87171; font-size: 18px; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.6; }
    .code { font-family: monospace; background: #0f172a; padding: 4px 8px; border-radius: 6px; color: #38bdf8; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Document File Not Found on Server</h2>
    <p>The file <span class="code">${resource.originalFileName || resource.title}</span> was not found in the live server storage.</p>
    <p>If this document was uploaded during local testing, please re-upload it directly on the live admin panel so the physical file is stored on the live server.</p>
  </div>
</body>
</html>`);
      }

      const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
      const wantsJson = req.query.json === 'true' || acceptsJson;

      if (wantsJson && req.query.stream !== 'true') {
        const protocol = req.protocol;
        const host = req.get('host');
        const url = `${protocol}://${host}/${cleanRelative || resource.filePath}`;

        return res.json({
          success: true,
          url,
          type: 'local',
          format: resource.format,
          mimeType: resource.mimeType,
          originalFileName: resource.originalFileName || resource.title,
        });
      }

      // Stream or render file directly for inline viewing (PDF, DOCX, XLSX, TXT, Images, Videos)
      const ext = path.extname(fullPath).toLowerCase();
      const safeFilename = (resource.originalFileName || resource.title || 'document').replace(/[^\w\s.-]/gi, '');
      const docTitle = resource.originalFileName || resource.title || 'Document Preview';

      // 1. DOCX inline render to formatted HTML
      if (ext === '.docx') {
        try {
          const mammothResult = await mammoth.convertToHtml({ path: fullPath });
          const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${docTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #f1f5f9;
      margin: 0;
      padding: 32px 16px;
      display: flex;
      justify-content: center;
    }
    .page {
      max-width: 900px;
      width: 100%;
      background: #ffffff;
      padding: 48px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      box-sizing: border-box;
      min-height: 80vh;
    }
    h1, h2, h3, h4, h5, h6 { color: #0f172a; margin-top: 1.4em; margin-bottom: 0.5em; font-weight: 700; }
    p { margin-bottom: 1em; font-size: 15px; }
    table { border-collapse: collapse; width: 100%; margin: 1.5em 0; border: 1px solid #cbd5e1; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 14px; }
    th { background: #f8fafc; font-weight: 600; color: #334155; }
    img { max-width: 100%; height: auto; border-radius: 6px; }
    ul, ol { padding-left: 24px; margin-bottom: 1em; }
    li { margin-bottom: 0.4em; }
    a { color: #2563eb; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="page">
    ${mammothResult.value || '<p style="color:#64748b;font-style:italic;">Empty document.</p>'}
  </div>
</body>
</html>`;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `inline; filename="${safeFilename}.html"`);
          return res.send(html);
        } catch (mErr) {
          console.error('Mammoth docx conversion error:', mErr);
        }
      }

      // 2. Excel & CSV inline render to formatted HTML table
      if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
        try {
          const workbook = xlsx.readFile(fullPath);
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const htmlTable = xlsx.utils.sheet_to_html(worksheet);
          const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${docTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      background: #f1f5f9;
      margin: 0;
      padding: 32px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .page {
      max-width: 1100px;
      width: 100%;
      background: #ffffff;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      box-sizing: border-box;
      overflow-x: auto;
    }
    h2 { margin-top: 0; margin-bottom: 16px; font-size: 18px; color: #0f172a; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; white-space: nowrap; }
    th { background: #f8fafc; font-weight: 600; color: #334155; }
    tr:nth-child(even) td { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="page">
    <h2>${firstSheetName || 'Sheet 1'}</h2>
    ${htmlTable}
  </div>
</body>
</html>`;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `inline; filename="${safeFilename}.html"`);
          return res.send(html);
        } catch (xErr) {
          console.error('XLSX conversion error:', xErr);
        }
      }

      // 3. Plain text files (.txt, .md, .log, .json)
      if (ext === '.txt' || ext === '.log' || ext === '.md' || ext === '.json') {
        try {
          const textContent = fs.readFileSync(fullPath, 'utf-8');
          const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${docTitle}</title>
  <style>
    body {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 14px;
      line-height: 1.6;
      color: #1e293b;
      background: #f8fafc;
      margin: 0;
      padding: 32px 16px;
      display: flex;
      justify-content: center;
    }
    .page {
      max-width: 900px;
      width: 100%;
      background: #ffffff;
      padding: 32px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      white-space: pre-wrap;
      word-break: break-word;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="page">${textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `inline; filename="${safeFilename}.html"`);
          return res.send(html);
        } catch (tErr) {
          console.error('Text read error:', tErr);
        }
      }

      // 4. PDF, Images, Videos, Audio, etc. (Direct inline streaming)
      const mimeMap = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.txt': 'text/plain; charset=utf-8',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.ppt': 'application/vnd.ms-powerpoint',
      };

      const mimeType = mimeMap[ext] || resource.mimeType || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);

      return res.sendFile(fullPath, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${safeFilename}"`,
        },
      });
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
      const cleanRelative = getNormalizedRelativeUploadPath(resource.filePath);
      const fullPath = await ensurePhysicalFile(resource.filePath);

      if (!fullPath) {
        return res.redirect(`https://api.kokaniengineers.org/api/resources/${resource._id}/download`);
      }

      const downloadName = resource.originalFileName || `${resource.title}${path.extname(cleanRelative || resource.filePath)}`;
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
      {
        $sort: { count: -1 },
      },
    ]);

    const total = await Resource.countDocuments(matchStage);

    res.json({
      success: true,
      categories: [
        { name: 'All resources', count: total },
        ...stats
          .filter((s) => s._id && s.count > 0)
          .map((s) => ({
            name: s._id,
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
