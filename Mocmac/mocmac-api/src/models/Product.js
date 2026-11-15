import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  swatch: { type: String, default: '' },
}, { _id: false });
const variantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  attributes: { type: [attributeSchema], default: [] },
  price: { type: Number, required: true, min: 0 },
  available: { type: Boolean, default: true },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '', trim: true },
    cat: { type: String, default: '' },
    type: { type: String, default: '' },
    region: { type: String, default: '' },
    province: { type: String, default: '' },
    village: { type: String, default: '' },
    price: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    ocop: { type: Number, default: 0 },
    heritage: { type: String, default: null },
    seasons: { type: [Number], default: [] },
    occasion: { type: [String], default: [] },
    inStock: { type: Boolean, default: true },
    preorder: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    badges: { type: [String], default: [] },
    images: { type: [String], default: [] },
    variants: { type: [variantSchema], default: [] },
    qrCode: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
