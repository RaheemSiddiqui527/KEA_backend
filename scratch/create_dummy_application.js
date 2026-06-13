import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const JobApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  coverLetter: String,
  status: { type: String, default: 'pending' }
}, { timestamps: true });
const JobApplication = mongoose.model('JobApplication', JobApplicationSchema);

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
}, { strict: false });
const User = mongoose.model('User', UserSchema);

const JobSchema = new mongoose.Schema({
  title: String,
  company: String
}, { strict: false });
const Job = mongoose.model('Job', JobSchema);

const ResumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  filePath: String
}, { strict: false });
const Resume = mongoose.model('Resume', ResumeSchema);

async function run() {
  try {
    const uri = "mongodb://localhost:27017/kea_db";
    await mongoose.connect(uri);
    console.log('Connected!');

    // 1. Find or create a user
    let user = await User.findOne({ role: 'user' });
    if (!user) {
      user = await User.create({
        name: 'Jane Doe',
        email: 'janedoe@example.com',
        role: 'user',
        membershipStatus: 'active'
      });
      console.log('Created dummy user:', user._id);
    } else {
      console.log('Found user:', user.name, user.email, user._id);
    }

    // 2. Find or create a job
    let job = await Job.findOne({});
    if (!job) {
      job = await Job.create({
        title: 'Software Engineer',
        company: 'Acme Corp',
        location: 'Remote',
        category: 'IT',
        status: 'approved'
      });
      console.log('Created dummy job:', job._id);
    } else {
      console.log('Found job:', job.title, 'at', job.company, job._id);
    }

    // 3. Find or create a resume
    let resume = await Resume.findOne({ user: user._id });
    if (!resume) {
      resume = await Resume.create({
        user: user._id,
        title: 'Jane Doe Resume',
        filePath: 'uploads/resumes/dummy_resume.pdf',
        originalName: 'dummy_resume.pdf',
        mimeType: 'application/pdf',
        size: 10240
      });
      console.log('Created dummy resume:', resume._id);
    } else {
      console.log('Found resume:', resume.title, resume._id);
    }

    // 4. Create Job Application
    // Clean first to avoid duplicate key error if index is unique
    await JobApplication.deleteOne({ user: user._id, job: job._id });

    const application = await JobApplication.create({
      user: user._id,
      job: job._id,
      resume: resume._id,
      coverLetter: `Dear Hiring Manager,

I am very excited to apply for the ${job.title} position at ${job.company}. 

With my experience in full-stack engineering and software development, I believe I would be an excellent fit for your team. I have attached my resume and look forward to hearing from you.

Sincerely,
${user.name}`,
      status: 'pending'
    });

    console.log('Created Job Application successfully:', application._id);
    console.log(JSON.stringify(application, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

run();
