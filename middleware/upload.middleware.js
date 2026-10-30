import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// Ensure upload directory exists
const UPLOAD_PATH = "uploads/documents";
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

/**
 * Allow documents, presentations, spreadsheets, and media
 */
const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|rtf|jpg|jpeg|png|webp|mp4|mov|avi)$/i;
  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());

  if (extValid) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Supported: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), Excel (XLS/XLSX), Text, Images, and Videos"));
  }
};

/**
 * Multer Disk Storage Config (Switched from Wasabi)
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

/* WASABI STORAGE CONFIG (COMMENTED OUT)
import multerS3 from "multer-s3";
import { s3 } from "../config/wasabi.client.js";
const BUCKET = process.env.AWS_BUCKET_NAME;
const uploadS3 = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `documents/${uuidv4()}${ext}`);
    },
  }),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
*/

export default upload;

