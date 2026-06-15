import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB. Creating index on { role: 1, createdAt: -1 }...");
    
    const db = mongoose.connection.db;
    await db.collection('users').createIndex(
      { role: 1, createdAt: -1 },
      { name: "role_createdAt" }
    );
    
    console.log("Index created successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
