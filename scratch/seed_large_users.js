import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with absolute path to .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Simple User Schema to bypass pre-save hooks and middleware for extremely fast seeding
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  memberId: { type: String, unique: true },
  membershipStatus: { type: String, default: 'active' },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    jobUpdates: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true },
    communityActivity: { type: Boolean, default: true },
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function run() {
  const args = process.argv.slice(2);
  const isClean = args.includes('--clean');
  
  let count = 100000;
  const countIdx = args.indexOf('--count');
  if (countIdx !== -1 && args[countIdx + 1]) {
    count = parseInt(args[countIdx + 1], 10);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Error: MONGO_URI is not defined in the environment configuration (.env).");
    process.exit(1);
  }

  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    if (isClean) {
      console.log("Cleaning up previously bulk-seeded users (emails matching 'bulk_user_*@example.com' or memberId matching 'KEA-BULK-*')...");
      const result = await User.deleteMany({
        $or: [
          { email: /^bulk_user_\d+@example.com$/ },
          { memberId: /^KEA-BULK-\d+$/ }
        ]
      });
      console.log(`Cleanup complete! Deleted ${result.deletedCount} users.`);
      await mongoose.disconnect();
      return;
    }

    console.log(`Starting seeding process for ${count.toLocaleString()} users...`);
    const startTime = Date.now();

    // 1. Hash the password once
    console.log("Pre-hashing dummy password ('password123')...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    console.log("Password pre-hashed successfully.");

    // 2. Generate and insert in batches
    const BATCH_SIZE = 5000;
    let insertedCount = 0;
    
    while (insertedCount < count) {
      const currentBatchSize = Math.min(BATCH_SIZE, count - insertedCount);
      const batch = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const globalIndex = insertedCount + i + 1;
        batch.push({
          name: `Bulk User ${globalIndex}`,
          email: `bulk_user_${globalIndex}@example.com`,
          password: hashedPassword,
          role: 'user',
          memberId: `KEA-BULK-${globalIndex}`,
          membershipStatus: 'pending',
          notificationPreferences: {
            email: true,
            jobUpdates: true,
            eventReminders: true,
            newsletter: true,
            communityActivity: true
          }
        });
      }

      // insertMany with ordered: false and lean: true for maximum insertion speed
      await User.insertMany(batch, { ordered: false, lean: true });
      
      insertedCount += currentBatchSize;
      const pct = ((insertedCount / count) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Inserted ${insertedCount.toLocaleString()} / ${count.toLocaleString()} users (${pct}%) - Elapsed time: ${elapsed}s`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Success! Seeded ${insertedCount.toLocaleString()} users in ${totalTime} seconds.`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("An error occurred during database seeding/cleanup:", error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

run();
