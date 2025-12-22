import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { s3 } from "../config/wasabi.client.js";
import dotenv from "dotenv";
dotenv.config();

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(
        null,
        `resumes/${req.user.id}/${Date.now()}${path.extname(file.originalname)}`
      );
    },
  }),
});

export default upload;
