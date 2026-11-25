import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store resumes in uploads/documents (or uploads/resumes)
const RESUME_UPLOAD_PATH = path.resolve(__dirname, "../uploads/documents");
if (!fs.existsSync(RESUME_UPLOAD_PATH)) {
  fs.mkdirSync(RESUME_UPLOAD_PATH, { recursive: true });
}

// Strictly allow ONLY PDF, DOC, and DOCX (No SVG, EXE, JS, etc.)
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream", // Sometimes sent by Windows for docx
]);

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(RESUME_UPLOAD_PATH)) {
      fs.mkdirSync(RESUME_UPLOAD_PATH, { recursive: true });
    }
    cb(null, RESUME_UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Generate secure unpredictable filename without user-controlled characters
    cb(null, `${uuidv4()}${ext}`);
  },
});

const resumeFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  // 1. Strict extension check
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error("INVALID_FILE_TYPE");
    err.code = "INVALID_FILE_TYPE";
    return cb(err, false);
  }

  // 2. Strict MIME type check
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    const err = new Error("INVALID_FILE_TYPE");
    err.code = "INVALID_FILE_TYPE";
    return cb(err, false);
  }

  cb(null, true);
};

const multerResumeUpload = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Strict 5 MB limit
    files: 1,
  },
});

/**
 * Express middleware wrapper to catch Multer errors and return clean, user-friendly responses
 * without exposing internal server paths or stack traces.
 */
export const resumeUploadMiddleware = (req, res, next) => {
  multerResumeUpload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size exceeds 5 MB limit. Please upload a smaller file.",
        });
      }
      if (err.code === "INVALID_FILE_TYPE" || err.message === "INVALID_FILE_TYPE") {
        return res.status(400).json({
          success: false,
          message: "Invalid file format. Only PDF, DOC, and DOCX files are allowed.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed.",
      });
    }
    next();
  });
};

/**
 * Validates file signature (magic bytes) to ensure file content matches allowed formats
 */
export const validateFileSignature = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // PDF signature: %PDF- (0x25 0x50 0x44 0x46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return true;
    }

    // DOCX signature (ZIP/PK archive): PK\x03\x04 (0x50 0x4B 0x03 0x04)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return true;
    }

    // Legacy DOC signature (OLE CFB): 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1
    if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export default resumeUploadMiddleware;
