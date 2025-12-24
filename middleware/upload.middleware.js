import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { s3 } from "../config/wasabi.client.js";

dotenv.config();

const BUCKET = process.env.AWS_BUCKET_NAME;

if (!BUCKET) {
  throw new Error("AWS_BUCKET_NAME is not defined in .env");
}

/**
 * Allow only documents
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only PDF and Word documents allowed"));
};

/**
 * Multer Wasabi Config
 */
const upload = multer({
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

export default upload;
