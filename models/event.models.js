import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['Webinar', 'Workshop', 'Conference', 'Meetup', 'Training', 'Seminar'],
    required: false,  // Changed to false
    default: 'Meetup'
  },
  venue: {
    type: String,
    required: true
  },
  location: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false  // Changed to false
  },
  startTime: String,
  endTime: String,
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizerName: String,
  organizerEmail: String,
  organizerPhone: String,
  maxAttendees: Number,
  registeredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'cancelled', 'completed'],
    default: 'pending'
  },
  registrationLink: String,
  registrationDeadline: Date,
  tags: [String],
  image: String,
  notes: String,
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: String
}, { timestamps: true });

// Text search index
eventSchema.index({ title: 'text', description: 'text' });

// Check if model exists before creating
export default mongoose.models.Event || mongoose.model('Event', eventSchema);