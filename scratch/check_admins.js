import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await mongoose.connection.collection('users').find({
    role: { $in: ['admin', 'superadmin', 'super-admin'] }
  }, { projection: { name: 1, email: 1, role: 1 } }).toArray();
  console.log('Admins found:', users);
  process.exit(0);
}
main();
