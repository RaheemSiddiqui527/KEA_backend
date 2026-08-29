import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    type: {
      type: String, // 'Newsletter', 'User Announcement', 'Transactional'
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    recipientGroup: {
      type: String, // 'All Subscribers', 'Active Users', etc.
      required: true,
    },
    recipientCount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Sent', 'Failed', 'Partial'],
      default: 'Sent',
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.model('EmailLog', emailLogSchema);
