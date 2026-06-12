import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function run() {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected!');
    
    const admins = await User.find({ role: 'admin' }).lean();
    console.log(`Found ${admins.length} admins.`);
    admins.forEach((admin, index) => {
      console.log(`\n--- Admin ${index + 1} ---`);
      console.log('ID:', admin._id);
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

run();
