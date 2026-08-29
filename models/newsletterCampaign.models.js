import mongoose from 'mongoose';

const newsletterCampaignSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent'],
    default: 'draft'
  },
  sentAt: {
    type: Date,
    default: null
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('NewsletterCampaign', newsletterCampaignSchema);
