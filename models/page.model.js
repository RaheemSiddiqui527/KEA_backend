import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['hero', 'features', 'mission', 'vision', 'stats', 'cta', 'faq', 'richText', 'cards', 'custom'],
    default: 'custom'
  },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  content: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  buttonText: { type: String, default: '' },
  buttonUrl: { type: String, default: '' },
  bgColor: { type: String, default: '#ffffff' },
  textColor: { type: String, default: '#1e293b' },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  cards: [
    {
      title: String,
      description: String,
      icon: String,
      imageUrl: String,
      linkText: String,
      linkUrl: String
    }
  ],
  stats: [
    {
      label: String,
      value: String,
      icon: String
    }
  ]
}, { _id: false });

const versionSchema = new mongoose.Schema({
  savedAt: { type: Date, default: Date.now },
  savedBy: { type: String, default: 'Super Admin' },
  sections: [sectionSchema],
  title: String,
  metaTitle: String,
  metaDescription: String
});

const pageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: '' },
  seoTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  isPublished: { type: Boolean, default: true },
  sections: [sectionSchema],
  draftSections: [sectionSchema],
  versionHistory: [versionSchema]
}, { timestamps: true });

export default mongoose.model('Page', pageSchema);
