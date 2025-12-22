import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['job_application', 'event_registration', 'document_download', 'connection', 'profile_update', 'other'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId
    },
    relatedModel: {
      type: String,
      enum: ['Job', 'Event', 'User', 'Document', 'Blog', 'Resource']
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;