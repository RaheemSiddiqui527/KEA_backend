import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connectedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Compound index to prevent duplicate connections
connectionSchema.index({ user: 1, connectedUser: 1 }, { unique: true });

export default mongoose.model('Connection', connectionSchema);