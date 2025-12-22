import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  fileUrl: {
  type: String,
  required: true
},
wasabiKey: String,
  
  originalName: String,
  mimeType: String,
  size: Number
}, { timestamps: true });

export default mongoose.model('Resume', resumeSchema);