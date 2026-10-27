import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  const uri = process.env.MONGO_URI;
  console.log('Connecting to:', uri ? 'URI found' : 'URI not found');
  await mongoose.connect(uri);
  console.log('Connected to DB');
  
  const roles = await mongoose.connection.collection('users').distinct('role');
  console.log('Distinct roles in users:', roles);

  const counts = await mongoose.connection.collection('users').aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Counts by role:', counts);

  const nonUsers = await mongoose.connection.collection('users').find({ role: { $ne: 'user' } }).project({ name: 1, email: 1, role: 1 }).toArray();
  console.log('Non-user accounts:', nonUsers);

  await mongoose.disconnect();
}

check().catch(console.error);
