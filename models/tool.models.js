import mongoose from 'mongoose';

const toolSchema = new mongoose.Schema({
  name: {
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
  version: String,
  platform: String, // Windows, Mac, Linux, Web, Cross-platform
  license: String, // Free, Open Source, Freemium, Paid, Trial
  downloadLink: String,
  documentationLink: String,
  features: [String],
  requirements: [String],
  fileSize: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  downloads: {
    type: Number,
    default: 0
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Text search index
toolSchema.index({ name: 'text', description: 'text', category: 'text' });

export default mongoose.model('Tool', toolSchema);