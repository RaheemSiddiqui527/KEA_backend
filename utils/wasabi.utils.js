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
    })
  );

  return { wasabiKey: key };
};

export const getSignedWasabiUrl = async (key) => {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 300 }
  );
};

export const deleteFromWasabi = async (key) => {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
};
export const deleteFilesFromS3 = deleteFromWasabi;
export const getSignedS3Url = getSignedWasabiUrl;
export const uploadFileToS3 = async (file, folder) =>
  uploadFileToWasabi({
    buffer: file.buffer,
    originalName: file.originalname,
    folder,
    mimetype: file.mimetype,
  });
