import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  content: { 
    type: String, 
    required: true 
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const threadSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  tags: {
    type: [String],
    default: []
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  replies: {
    type: [replySchema],
    default: []
  },
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending",
},

  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for search
threadSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('Thread', threadSchema);