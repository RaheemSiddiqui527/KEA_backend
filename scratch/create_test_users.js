import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import User from '../models/user.models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with absolute path to .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Error: MONGO_URI is not defined in the environment configuration.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    // 1. Create admin user (delete existing first to avoid duplicate key errors)
    console.log("Creating Admin user...");
    await User.deleteOne({ email: 'test1@gmail.com' });
    const admin = await User.create({
      name: 'Test Admin',
      email: 'test1@gmail.com',
      password: '12345678',
      role: 'admin'
    });
    console.log(`🎉 Admin user created successfully: ID=${admin._id}, Email=${admin.email}, Role=${admin.role}`);

    // 2. Create normal user (delete existing first to avoid duplicate key errors)
    console.log("Creating Normal user...");
    await User.deleteOne({ email: 'nexcoreuser@gmail.com' });
    const user = await User.create({
      name: 'Nexcore User',
      email: 'Nexcoreuser@gmail.com',
      password: '12345678',
      role: 'user'
    });
    console.log(`🎉 Normal user created successfully: ID=${user._id}, Email=${user.email}, MemberID=${user.memberId}, Role=${user.role}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (error) {
    console.error("Error creating users:", error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

run();
