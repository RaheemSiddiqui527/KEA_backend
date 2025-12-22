import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { s3 } from "../config/wasabi.client.js";

/**
 * File filter (PDF, DOC, DOCX only)
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and Word documents are allowed"), false);
  }
};

/**
 * Multer config with Wasabi
 */
const upload = multer({
  storage: multerS3({
    s3,
    bucket: "your-bucket-name",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;

      cb(null, `uploads/${uniqueName}`);
    },
  }),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;
