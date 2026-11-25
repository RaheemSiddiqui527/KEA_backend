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

    // 🔐 Store path for local storage
    filePath: {
      type: String,
    },



    skills: {
      type: [String],
      default: [],
    },

    originalName: String,
    mimeType: String,
    size: Number,
  },
  { timestamps: true }
);

// Security: Never expose internal server filesystem path in JSON responses
resumeSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.filePath;
    return ret;
  },
});

export default mongoose.model('Resume', resumeSchema);
