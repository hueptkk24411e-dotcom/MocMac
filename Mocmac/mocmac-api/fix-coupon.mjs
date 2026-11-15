import mongoose from 'mongoose';
import { Coupon } from './src/models/Coupon.js';

await mongoose.connect('mongodb://127.0.0.1:27017/mocmac');

const coupon = await Coupon.findOne({ code: 'GIAM10K' }).select('+redeemedBy').lean();
if (coupon) {
  console.log('Existing GIAM10K:', JSON.stringify({
    code: coupon.code,
    minOrderValue: coupon.minOrderValue,
    discountValue: coupon.discountValue,
    discountType: coupon.discountType,
    scope: coupon.scope,
    active: coupon.active,
    expiryDate: coupon.expiryDate,
    usedCount: coupon.usedCount,
    usageLimit: coupon.usageLimit,
  }, null, 2));

  // Update to ensure minOrderValue is 0
  await Coupon.updateOne({ code: 'GIAM10K' }, {
    minOrderValue: 0,
    active: true,
    expiryDate: new Date('2027-12-31'),
  });
  console.log('✅ Updated GIAM10K: minOrderValue=0, active=true');
} else {
  console.log('GIAM10K not found, creating...');
  const newCoupon = new Coupon({
    code: 'GIAM10K',
    description: 'Giảm 10.000đ cho đơn bất kỳ',
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
  await newCoupon.save();
  console.log('✅ Created GIAM10K');
}

// Also add a small percent coupon with minOrderValue: 0
const existing2 = await Coupon.findOne({ code: 'GIAM5PCT' }).lean();
if (!existing2) {
  const c2 = new Coupon({
    code: 'GIAM5PCT',
    description: 'Giảm 5% đơn hàng',
    discountType: 'percent',
    discountValue: 5,
    scope: 'order',
    firstOrderOnly: false,
    minOrderValue: 0,
    maxDiscount: 20000,
    usageLimit: 0,
    usedCount: 0,
    expiryDate: new Date('2027-12-31'),
    active: true,
  });
  await c2.save();
  console.log('✅ Created GIAM5PCT (giảm 5%, tối đa 20.000đ)');
}

await mongoose.disconnect();
console.log('✅ Done');
