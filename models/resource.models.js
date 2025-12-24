import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        'Career guidance',
        'Technical papers',
        'Project reports',
        'Workshop & webinars',
        'Templates & checklists',
      ],
    },

    format: {
      type: String,
      required: true,
      enum: ['PDF', 'DOCX', 'Video', 'Link', 'Images', 'File'],
    },

    tags: [{ type: String, trim: true }],

    // 🔐 For external resources only (Video / Link)
    externalLink: {
      type: String,
    },

    // 🔐 For Wasabi stored files only
    wasabiKey: {
      type: String,
    },

    description: {
      type: String,
      trim: true,
    },

    author: {
      type: String,
      default: 'Anonymous',
      trim: true,
    },

    icon: {
      type: String,
      default: 'FileText',
      enum: ['FileText', 'Video', 'Link2', 'Image'],
    },

    fileSize: Number,
    mimeType: String,
  },
  { timestamps: true }
);

// 🔎 Text search index
resourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

export default mongoose.model('Resource', resourceSchema);
