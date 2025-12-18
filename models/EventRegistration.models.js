import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'attended'],
    default: 'confirmed'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to prevent duplicate registrations
eventRegistrationSchema.index({ user: 1, event: 1 }, { unique: true });

// Check if model exists before creating
export default mongoose.models.EventRegistration || mongoose.model('EventRegistration', eventRegistrationSchema);