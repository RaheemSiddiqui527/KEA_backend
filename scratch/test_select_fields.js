import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function run() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log("Connected to database.");

  // Test 1: Fetching all fields (current way)
  console.log("\n--- Test 1: Fetching all fields (except password) ---");
  const start1 = Date.now();
  const res1 = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(100000)
    .select("-password")
    .lean();
  console.log(`Time taken: ${(Date.now() - start1) / 1000} seconds`);
  console.log(`JSON length: ${JSON.stringify(res1).length} bytes`);

  // Test 2: Fetching only required fields
  console.log("\n--- Test 2: Fetching only required fields for export ---");
  const start2 = Date.now();
  const res2 = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(100000)
    .select("name email role memberId membershipStatus profile createdAt")
    .lean();
  console.log(`Time taken: ${(Date.now() - start2) / 1000} seconds`);
  console.log(`JSON length: ${JSON.stringify(res2).length} bytes`);

  await mongoose.disconnect();
}

run();
