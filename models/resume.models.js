import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    // 🔐 Only store Wasabi key (secure & correct)
    wasabiKey: {
      type: String,
      required: true,
    },

    originalName: String,
    mimeType: String,
    size: Number,
  },
  { timestamps: true }
);

export default mongoose.model('Resume', resumeSchema);
