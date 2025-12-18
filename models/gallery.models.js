import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['Event Category', 'Project Showcase', 'Member Activities', 'Good Wishes', 'All photos'],
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  eventDate: Date,
  location: String
}, { timestamps: true });

// Text search index
gallerySchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);