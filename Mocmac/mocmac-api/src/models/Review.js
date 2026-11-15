import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Number },
    userName: { type: String, trim: true },
    content: { type: String, trim: true },
    isDemo: { type: Boolean },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true },
    status: { type: String, enum: ['visible', 'hidden'], default: 'visible' },
    reply: { type: String, default: '', trim: true },
    replyAt: { type: Date },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, {
  unique: true,
  name: 'review_user_product_unique',
  partialFilterExpression: { product: { $type: 'objectId' }, user: { $type: 'objectId' } },
});
reviewSchema.index({ productId: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
