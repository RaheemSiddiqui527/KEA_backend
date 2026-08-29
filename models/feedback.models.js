import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  category: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  adminResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Text search index
feedbackSchema.index({ subject: 'text', message: 'text' });

export default mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);