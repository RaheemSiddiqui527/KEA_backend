import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config(); // 🔥 REQUIRED

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY
) {
  throw new Error("Wasabi credentials are missing in .env");
}

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.WASABI_ENDPOINT, // 🔥 REQUIRED FOR WASABI
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
  },
});
