import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not defined");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB. Creating indexes...");

    const db = mongoose.connection.db;
    
    // Create compound index for members page queries
    console.log("Creating compound index on { role: 1, membershipStatus: 1, createdAt: -1 }...");
    await db.collection('users').createIndex(
      { role: 1, membershipStatus: 1, createdAt: -1 },
      { name: "role_membershipStatus_createdAt" }
    );
    
    // Create single index on createdAt
    console.log("Creating index on { createdAt: -1 }...");
    await db.collection('users').createIndex(
      { createdAt: -1 },
      { name: "createdAt_idx" }
    );

    console.log("Indexes created successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error creating indexes:", err);
    process.exit(1);
  }
}

run();
