import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists using absolute path to prevent CWD discrepancies
const UPLOAD_PATH = path.resolve(__dirname, "../uploads/documents");
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

/**
 * Allow documents, presentations, spreadsheets, and media
 */
const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|csv|txt|rtf|jpg|jpeg|png|webp|gif|svg|mp4|mov|avi|mkv|webm)$/i;
  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());

  if (extValid) {
    cb(null, true);
  } else {
    // Gracefully reject ONLY this individual file so other valid files in bulk upload are not aborted
    req.skippedUploadFiles = req.skippedUploadFiles || [];
    req.skippedUploadFiles.push({
      originalname: file.originalname,
      reason: `Unsupported file type (${path.extname(file.originalname) || 'shortcut'})`,
    });
    cb(null, false);
  }
};

/**
 * Multer Disk Storage Config
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_PATH)) {
      fs.mkdirSync(UPLOAD_PATH, { recursive: true });
    }
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

/**
 * Multer Config
 */
const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: 550 * 1024 * 1024, // 500MB+ buffer per file
    files: 100, // Up to 100 files per bulk upload batch
  },
});

export default upload;

