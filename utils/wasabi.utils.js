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

export const uploadFileToWasabi = async (file, folder) => {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${uuidv4()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return key;
};

export const getSignedWasabiUrl = async (key) => {
  return await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: 300 }
  );
};

export const deleteFromWasabi = async (key) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
};
