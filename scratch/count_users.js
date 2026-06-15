import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const count = await db.collection('users').countDocuments();
  console.log(`Total users in database: ${count}`);
  
  const pendingCount = await db.collection('users').countDocuments({ membershipStatus: 'pending' });
  console.log(`Pending users: ${pendingCount}`);

  const activeCount = await db.collection('users').countDocuments({ membershipStatus: 'active' });
  console.log(`Active users: ${activeCount}`);

  await mongoose.disconnect();
}

run();
