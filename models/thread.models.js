import mongoose from 'mongoose';

/* =========================
   REPLY SCHEMA
========================= */
const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/* =========================
   THREAD SCHEMA
========================= */
const threadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    content: {
      type: String,
      required: true,
      trim: true
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
      ref: 'User',
      required: true
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

    /* =========================
       MODERATION / APPROVAL
    ========================= */
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvedAt: {
      type: Date
    },

    rejectedReason: {
      type: String,
      trim: true
    },

    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

/* =========================
   INDEXES
========================= */

// Text search
threadSchema.index({ title: 'text', content: 'text' });

// Common filters
threadSchema.index({ category: 1, status: 1 });
threadSchema.index({ isPinned: -1, lastActivity: -1 });

export default mongoose.model('Thread', threadSchema);
