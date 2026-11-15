import mongoose from 'mongoose';
import { Coupon } from './src/models/Coupon.js';

const coupon = new Coupon({
  code: 'GIAM10K',
  description: 'Giảm 10.000đ cho đơn hàng bất kỳ',
  discountType: 'fixed',
  discountValue: 10000,
  scope: 'order',
  firstOrderOnly: false,
  minOrderValue: 0,
  maxDiscount: 0,
  usageLimit: 0,
  usedCount: 0,
  expiryDate: new Date('2027-12-31'),
  active: true,
});

await mongoose.connect('mongodb://127.0.0.1:27017/mocmac');
await coupon.save();
console.log('✅ Đã tạo voucher GIAM10K (giảm 10.000đ, không yêu cầu đơn tối thiểu)');
await mongoose.disconnect();
