import mongoose from 'mongoose';

const seminarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: String,
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: String,
  venue: {
    type: String,
    required: true
  },
  organizer: {
    type: String,
    required: true
  },
  organizerRole: String,
  organizerBio: String,
  speaker: String,
  speakerTitle: String,
  speakerBio: String,
  topics: [String],
  targetAudience: String,
  registrationLink: String,
  registrationDeadline: Date,
  maxAttendees: Number,
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resources: [{
    title: String,
    description: String,
    url: String,
    type: String // PDF, Video, Link, etc.
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Text search index
seminarSchema.index({ title: 'text', description: 'text', organizer: 'text' });

export default mongoose.model('Seminar', seminarSchema);