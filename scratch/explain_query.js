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

  const explain = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(100000)
    .select("-password")
    .explain();

  console.log("Query Plan:");
  console.log(JSON.stringify(explain.queryPlanner, null, 2));

  await mongoose.disconnect();
}

run();
