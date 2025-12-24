import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

/**
 * S3 / Wasabi Client
 */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.WASABI_ENDPOINT, // ✅ REQUIRED for Wasabi
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload File
 */
export const uploadFileToS3 = async (file, folder = "uploads") => {
  const key = `${folder}/${uuidv4()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
  };
};

/**
 * Get Signed URL (View / Download)
 */
export const getSignedS3Url = async (key) => {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: "inline", // 👀 browser preview
    }),
    { expiresIn: 3600 } // 1 hour
  );
};

/**
 * Delete File
 */
export const deleteFilesFromS3 = async (key) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    })
  );
};
