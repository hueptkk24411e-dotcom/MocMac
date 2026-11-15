import mongoose from 'mongoose';

const giftSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, min: 1 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 5000 },
    cat: { type: String, default: '', trim: true, maxlength: 120 },
    type: { type: String, default: '', trim: true, maxlength: 120 },
    region: { type: String, default: '', trim: true, maxlength: 120 },
    province: { type: String, default: '', trim: true, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    rate: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
    inStock: { type: Boolean, default: true },
    icon: { type: String, default: '🎁', trim: true, maxlength: 40 },
    images: { type: [String], default: [] },
    source: { type: String, default: '', trim: true, maxlength: 200 },
    link: { type: String, default: '', trim: true, maxlength: 2048 },
  },
  { timestamps: true }
);

export const Gift = mongoose.model('Gift', giftSchema);
