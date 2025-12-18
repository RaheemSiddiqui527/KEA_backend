import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Career guidance',
        'Technical papers',
        'Project reports',
        'Workshop & webinars',
        'Templates & checklists'
      ]
    },
    format: {
      type: String,
      required: true,
      enum: ['PDF', 'DOCX', 'Video', 'Link', 'Images', 'File']
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    link: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    author: {
      type: String,
      default: 'Anonymous',
      trim: true
    },
    icon: {
      type: String,
      default: 'FileText',
      enum: ['FileText', 'Video', 'Link2', 'Image']
    },
    fileSize: String,
    filePath: String
  },
  {
    timestamps: true
  }
);

// Text index for search
resourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
