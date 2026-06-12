import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env' });

const JobSchema = new mongoose.Schema({}, { strict: false });
const Job = mongoose.model('Job', JobSchema);

async function run() {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    console.log('Connected!');
    
    const jobs = await Job.find({}).lean();
    console.log(`Found ${jobs.length} jobs.`);
    jobs.forEach((job, index) => {
      console.log(`\n--- Job ${index + 1} ---`);
      console.log('ID:', job._id);
      console.log('Title:', job.title);
      console.log('Company:', job.company);
      console.log('Status:', job.status);
      console.log('PostedBy:', job.postedBy);
      console.log('Keys:', Object.keys(job));
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

run();
