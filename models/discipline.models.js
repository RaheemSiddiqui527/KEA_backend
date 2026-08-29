import mongoose from 'mongoose';

const disciplineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // We store a lowercase version for case-insensitive unique checks during 'findOrCreate' operations
    nameLower: {
      type: String,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Engineering', 'Professional', 'Uncategorized'],
      default: 'Uncategorized',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to populate nameLower
disciplineSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.nameLower = this.name.trim().toLowerCase();
  }
  next();
});

// Also handle updates
disciplineSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();
  if (update.name) {
    update.nameLower = update.name.trim().toLowerCase();
  } else if (update.$set && update.$set.name) {
    update.$set.nameLower = update.$set.name.trim().toLowerCase();
  }
});

export default mongoose.model('Discipline', disciplineSchema);
