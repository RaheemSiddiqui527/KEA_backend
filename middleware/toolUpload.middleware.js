import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// Ensure upload directory exists
const UPLOAD_PATH = "uploads/tools";
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

/**
 * Allow a wide variety of files for offline tools
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = /zip|rar|7z|tar|gz|exe|msi|dmg|apk|jar|bin|pdf|doc|docx|xls|xlsx|png|jpg|jpeg/i;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extname) {
    cb(null, true);
  } else {
    cb(new Error("File type not supported for tools. Allowed: archives (zip, rar, 7z, tar, gz), executables (exe, msi, dmg, apk, jar, bin), documents (pdf, doc, docx, xls, xlsx) and images."));
  }
};

/**
 * Multer Disk Storage Config
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
 * Multer Config for tools
 */
const toolUpload = multer({
  storage: storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

export default toolUpload;
