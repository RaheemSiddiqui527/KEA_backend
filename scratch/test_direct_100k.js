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

  console.log("\n--- Testing Direct 100,000 records fetch with select projection ---");
  const start = Date.now();
  const res = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(100000)
    .select("name email role memberId membershipStatus profile createdAt")
    .lean();
  console.log(`Time taken: ${(Date.now() - start) / 1000} seconds`);
  console.log(`Length: ${res.length} records`);
  console.log(`JSON length: ${(JSON.stringify(res).length / 1024 / 1024).toFixed(2)} MB`);

  await mongoose.disconnect();
}

run();
