import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  siteName: String,
  siteUrl: String,
  adminEmail: String,
  contactEmail: String,
  logo: String,
  smtpHost: String,
  smtpPort: String,
  smtpUsername: String,
  smtpPassword: String,
  smtpFromEmail: String,
  smtpFromName: String,
  allowRegistration: Boolean,
  requireEmailVerification: Boolean,
  defaultMembershipStatus: String,
  autoApproveMembers: Boolean,
  autoApproveJobs: Boolean,
  autoApproveBlogs: Boolean,
  autoApproveEvents: Boolean,
  moderationEmail: String,
  supportStaff: [String],
   settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      jobUpdates: {
        type: Boolean,
        default: true
      },
      eventReminders: {
        type: Boolean,
        default: true
      },
      newsletter: {
        type: Boolean,
        default: true
      },
      communityActivity: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'members', 'private'],
        default: 'members'
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      showPhone: {
        type: Boolean,
        default: false
      }
    }
  }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);