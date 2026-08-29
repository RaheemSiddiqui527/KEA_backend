import mongoose from 'mongoose';

const resourceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subcategories: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('ResourceCategory', resourceCategorySchema);
