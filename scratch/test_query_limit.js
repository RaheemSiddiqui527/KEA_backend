import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'user' },
  memberId: { type: String, unique: true },
  membershipStatus: { type: String, default: 'active' },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not defined");
    process.exit(1);
  }

  try {
    console.log("Connecting...");
    await mongoose.connect(uri);
    console.log("Connected. Querying 1,000,000 users...");

    const start = Date.now();
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`Initial memory: ${initialMemory.toFixed(2)} MB`);

    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(1000000)
      .select("-password")
      .lean();

    const duration = (Date.now() - start) / 1000;
    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    console.log(`Successfully fetched ${users.length} users!`);
    console.log(`Time taken: ${duration.toFixed(2)} seconds`);
    console.log(`Final memory: ${finalMemory.toFixed(2)} MB`);
    console.log(`Memory growth: ${(finalMemory - initialMemory).toFixed(2)} MB`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error running test query:", err);
    process.exit(1);
  }
}

run();
