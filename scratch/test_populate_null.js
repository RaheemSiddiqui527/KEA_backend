import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const JobSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { strict: false });
const Job = mongoose.model('Job', JobSchema);

// User schema is needed for ref
const UserSchema = new mongoose.Schema({}, { strict: false });
mongoose.model('User', UserSchema);

async function run() {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected!');
    
    const jobs = await Job.find({}).populate('postedBy', 'name email').lean();
    console.log(`Found ${jobs.length} jobs.`);
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}: ID=${job._id}, Title=${job.title}, Status=${job.status}, postedBy=${JSON.stringify(job.postedBy)}`);
      if (!job.postedBy) {
        console.log('⚠️ WARNING: postedBy is null or missing for this job!');
      }
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

run();
