import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true,
      index: true
    },
    productName: {
      type: String,
      default: ''
    },
    userName: {
      type: String,
      default: '',
      trim: true
    },
    // Backward compatibility for old review documents.
    name: {
      type: String,
      default: '',
      trim: true
    },
    username: {
      type: String,
      default: '',
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isDemo: {
      type: Boolean,
      default: false
    }
  },
  {
    collection: 'reviews',
    versionKey: false
  }
);

reviewSchema.index({ productId: 1, createdAt: -1 });

export const Review =
  mongoose.models.Review ||
  mongoose.model('Review', reviewSchema);
