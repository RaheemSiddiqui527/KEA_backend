import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { s3 } from "../config/wasabi.client.js";

const BUCKET = process.env.AWS_BUCKET_NAME;

/**
 * Upload file to Wasabi (internal)
 */
export const uploadFileToWasabi = async ({
  buffer,
  originalName,
  folder,
  mimetype,
}) => {
  const ext = path.extname(originalName);
  const key = `${folder}/${uuidv4()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ContentDisposition: 'inline', // ✅ For inline viewing
      CacheControl: 'public, max-age=31536000',
    })
  );

  return { wasabiKey: key };
};

/**
 * Get signed URL for viewing
 */
export const getSignedWasabiUrl = async (key) => {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,

      // 🔥 PDF ko browser me render karne ke liye
      ResponseContentType: 'application/pdf',
      ResponseContentDisposition: 'inline',
    }),
    { expiresIn: 300 }
  );
};


/**
 * Get file as buffer for proxy/download
 */
export const getFileBuffer = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const response = await s3.send(command);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return {
      buffer: Buffer.concat(chunks),
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    };
  } catch (error) {
    console.error('❌ Get buffer error:', error);
    throw new Error(`Failed to get file: ${error.message}`);
  }
};

/**
 * Delete file from Wasabi
 */
export const deleteFromWasabi = async (key) => {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
};

// ✅ Export aliases for consistency
export const deleteFilesFromS3 = deleteFromWasabi;
export const getSignedS3Url = getSignedWasabiUrl;
export const uploadFileToS3 = async (file, folder) =>
  uploadFileToWasabi({
    buffer: file.buffer,
    originalName: file.originalname,
    folder,
    mimetype: file.mimetype,
  });

// ✅ Default export
export default {
  uploadFileToS3,
  uploadFileToWasabi,
  getSignedS3Url,
  getSignedWasabiUrl,
  getFileBuffer,
  deleteFilesFromS3,
  deleteFromWasabi,
};