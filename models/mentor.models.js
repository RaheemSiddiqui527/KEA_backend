import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
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
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Professional title is required'],
    trim: true
  },
  organization: {
    type: String,
    required: [true, 'Organization is required'],
    trim: true
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    minlength: [50, 'Bio must be at least 50 characters'],
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  profileImage: String,
  expertise: {
    type: [String],
    required: [true, 'At least one expertise area is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one expertise area is required'
    }
  },
  skills: {
    type: [String],
    required: [true, 'At least one skill is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one skill is required'
    }
  },
  topics: [String],
  focusAreas: [String],
  experience: {
    years: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Years of experience cannot be negative']
    },
    description: {
      type: String,
      required: [true, 'Experience description is required']
    }
  },
  education: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: String
  }],
  achievements: [String],
  languages: [String],
  availability: [availabilitySlotSchema],
  contact: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
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
      default: 0,
      min: 0,
      max: 5
    },
    reviews: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: false // Inactive by default until admin approves
  },
  isApproved: {
    type: Boolean,
    default: false // Requires admin approval
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  timezone: String
}, { 
  timestamps: true 
});

// Text search index
mentorSchema.index({ 
  name: 'text', 
  bio: 'text', 
  expertise: 'text',
  skills: 'text',
  organization: 'text'
});

// Index for filtering
mentorSchema.index({ isApproved: 1, isActive: 1, approvalStatus: 1 });
mentorSchema.index({ 'experience.years': 1 });
mentorSchema.index({ createdAt: -1 });

export default mongoose.model('Mentor', mentorSchema);