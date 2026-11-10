import 'dotenv/config';
import mongoose from 'mongoose';
import { Coupon } from './models/Coupon.js';

const expiryDate = new Date();
expiryDate.setFullYear(expiryDate.getFullYear() + 1);

try {
  await mongoose.connect(process.env.MONGODB_URI);

  const vouchers = [
    {
      code: 'NEW20',
      description: 'Khách hàng mới: giảm 20% cho đơn hàng đầu tiên.',
      discountType: 'percent',
      discountValue: 20,
      scope: 'order',
      firstOrderOnly: true,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 0,
    },
    {
      code: 'FREESHIP',
      description: 'Miễn phí vận chuyển cho đơn hàng có phí ship.',
      discountType: 'fixed',
      discountValue: 30000,
      scope: 'shipping',
      firstOrderOnly: false,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 0,
    },
  ];

  for (const voucher of vouchers) {
    await Coupon.updateOne(
      { code: voucher.code },
      {
        $set: { ...voucher, active: true },
        $setOnInsert: { expiryDate },
      },
      { upsert: true, runValidators: true },
    );
    console.log(`Đã tạo/cập nhật voucher ${voucher.code}; hạn sử dụng ${expiryDate.toISOString().slice(0, 10)}.`);
  }
} finally {
  await mongoose.disconnect();
}
