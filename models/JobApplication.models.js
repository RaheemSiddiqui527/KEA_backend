import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  coverLetter: String,
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Index to prevent duplicate applications
jobApplicationSchema.index({ user: 1, job: 1 }, { unique: true });

export default mongoose.model('JobApplication', jobApplicationSchema);