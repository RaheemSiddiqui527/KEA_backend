import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: String,
  endTime: String,
  isBooked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const mentorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  organization: String,
  bio: {
    type: String,
    required: true
  },
  profileImage: String,
  expertise: [String],
  skills: [String],
  topics: [String],
  focusAreas: [String],
  experience: {
    years: Number,
    description: String
  },
  education: [{
    degree: String,
    institution: String,
    year: String
  }],
  achievements: [String],
  languages: [String],
  availability: [availabilitySlotSchema],
  contact: {
    email: String,
    linkedin: String,
    phone: String
  },
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0
    },
    reviews: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  location: String,
  timezone: String
}, { timestamps: true });

// Text search index
mentorSchema.index({ name: 'text', bio: 'text', expertise: 'text' });

export default mongoose.model('Mentor', mentorSchema);