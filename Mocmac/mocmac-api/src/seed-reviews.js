import 'dotenv/config';
import mongoose from 'mongoose';

import { Product } from './models/Product.js';
import { User } from './models/User.js';
import { Review } from './models/Review.js';

console.log('=== BẮT ĐẦU SEED REVIEWS ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Đã cấu hình' : 'THIẾU');

const COMMENTS = [
  { rating: 5, texts: [
    'Sản phẩm tuyệt vời, đúng như mô tả!',
    'Chất lượng rất tốt, đóng gói cẩn thận.',
    'Mua lần 2 rồi, vẫn ưng ý như lần đầu.',
    'Giá cả hợp lý, ship nhanh chóng.',
    'Sản phẩm chính hãng, cam kết chất lượng.',
    'Rất hài lòng về sản phẩm này.',
    'Đóng gói đẹp, bọc kín, an toàn.',
    'Sẽ mua tiếp các sản phẩm khác.',
    'Chất lượng vượt mong đợi.',
    'Shop uy tín, hỗ trợ nhiệt tình.',
  ]},
  { rating: 4, texts: [
    'Sản phẩm tốt, ship hơi chậm một chút.',
    'Chất lượng ổn, đóng gói kỹ.',
    'Đúng như hình ảnh, hài lòng.',
    'Mua làm quà tặng, người nhận thích.',
    'Sản phẩm ngon, giá hợp lý.',
    'Hơi sợ bị nát khi ship nhưng may mắn.',
    'Tuyệt vời, sẽ ủng hộ shop lâu dài.',
    'Chất lượng tốt, giao hàng đúng hẹn.',
  ]},
  { rating: 3, texts: [
    'Sản phẩm ổn, không có gì đặc biệt.',
    'Chuẩn chỉnh, dùng được.',
    'Bình thường, ngon lành.',
    'Được như mong đợi.',
    'Sản phẩm cơ bản, dùng ổn.',
  ]},
  { rating: 2, texts: [
    'Sản phẩm hơi thua hình ảnh.',
    'Ship hơi lâu, sản phẩm bình thường.',
    'Chưa hài lòng lắm, chất lượng trung bình.',
  ]},
  { rating: 1, texts: [
    'Sản phẩm không như mô tả.',
    'Thất vọng về chất lượng.',
    'Không khuyên mua.',
  ]},
];

const USER_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Châu', 'Phạm Đức Dũng',
  'Hoàng Thị Giang', 'Vũ Minh Hùng', 'Đặng Thị Lan', 'Bùi Văn Nam',
  'Phan Thị Oanh', 'Đỗ Minh Quân', 'Ngô Thị Xuân', 'Lý Văn Yến',
  'Đinh Thị Hương', 'Trịnh Văn Tùng', 'Võ Thị Mai', 'Cao Văn Phong',
];

async function seedReviews() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Đã kết nối MongoDB');

  // Drop the problematic unique index if it exists with null values
  try {
    await mongoose.connection.db.collection('reviews').dropIndex('review_user_product_unique');
    console.log('Đã xóa unique index cũ');
  } catch (e) {
    console.log('Index không tồn tại hoặc đã xóa:', e.message);
  }

  // Recreate index with partialFilterExpression (no sparse)
  await mongoose.connection.db.collection('reviews').createIndex(
    { product: 1, user: 1 },
    { unique: true, name: 'review_user_product_unique', partialFilterExpression: { product: { $type: 'objectId' }, user: { $type: 'objectId' } } }
  );
  console.log('Đã tạo lại unique index partial');

  // Lấy tất cả sản phẩm có _id hợp lệ
  const products = await Product.find({ _id: { $exists: true, $ne: null } }).lean();
  console.log(`Tìm thấy ${products.length} sản phẩm`);

  // Lấy hoặc tạo users (customer) có _id hợp lệ
  let users = await User.find({ role: 'customer', _id: { $exists: true, $ne: null } }).lean();
  if (users.length === 0) {
    console.log('Tạo users mẫu...');
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('Customer@123', 10);
    const userDocs = USER_NAMES.map((name, i) => ({
      name,
      email: `customer${i + 1}@mocmac.vn`,
      phone: `09${String(i + 1).padStart(8, '0')}`,
      passwordHash,
      role: 'customer',
    }));
    await User.insertMany(userDocs);
    users = await User.find({ role: 'customer', _id: { $exists: true, $ne: null } }).lean();
    console.log(`Đã tạo ${users.length} users khách hàng`);
  }

  // Xóa reviews cũ (chỉ xóa demo)
  await Review.deleteMany({ isDemo: true });
  console.log('Đã xóa reviews demo cũ');

  const reviewsToInsert = [];

  for (const product of products) {
    if (!product._id) continue;
    
    const targetReviewCount = product.reviews || Math.floor(Math.random() * 20) + 5;
    const targetRate = product.rate || 4.5;

    // Tính toán phân phối rating để khớp với rate trung bình
    const distribution = calculateDistribution(targetReviewCount, targetRate);

    let reviewIndex = 0;
    for (const [rating, count] of Object.entries(distribution)) {
      for (let i = 0; i < count; i++) {
        const user = users[reviewIndex % users.length];
        if (!user._id) continue;
        
        const comments = COMMENTS.find(c => c.rating === parseInt(rating));
        const content = comments.texts[Math.floor(Math.random() * comments.texts.length)];

        reviewsToInsert.push({
          product: product._id,
          user: user._id,
          productId: product.id,
          userName: user.name,
          content,
          rating: parseInt(rating),
          comment: content,
          status: 'visible',
          isDemo: true,
          createdAt: randomDateInLastDays(365),
        });
        reviewIndex++;
      }
    }
  }

  // Insert reviews in batches
  const BATCH_SIZE = 500;
  for (let i = 0; i < reviewsToInsert.length; i += BATCH_SIZE) {
    const batch = reviewsToInsert.slice(i, i + BATCH_SIZE);
    try {
      await Review.insertMany(batch, { ordered: false });
      console.log(`Đã nạp batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(reviewsToInsert.length / BATCH_SIZE)} (${batch.length} reviews)`);
    } catch (e) {
      console.error(`Lỗi batch ${Math.floor(i / BATCH_SIZE) + 1}:`, e.message);
    }
  }

  console.log(`Hoàn tất! Đã nạp ${reviewsToInsert.length} reviews cho ${products.length} sản phẩm`);

  // Cập nhật lại reviews count và rate cho products
  for (const product of products) {
    if (!product._id) continue;
    const productReviews = await Review.find({ product: product._id, status: 'visible' }).lean();
    if (productReviews.length > 0) {
      const avgRate = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      await Product.updateOne(
        { _id: product._id },
        { reviews: productReviews.length, rate: Math.round(avgRate * 10) / 10 }
      );
    }
  }
  console.log('Đã cập nhật lại reviews count và rate cho tất cả sản phẩm');

  await mongoose.disconnect();
  console.log('Seed reviews hoàn tất');
}

function calculateDistribution(totalReviews, targetAvgRate) {
  // Phân phối rating dựa trên targetAvgRate
  const baseDist = {
    5: 0.5,
    4: 0.25,
    3: 0.15,
    2: 0.07,
    1: 0.03,
  };

  // Điều chỉnh phân phối để khớp với targetAvgRate
  let dist = { ...baseDist };
  
  if (targetAvgRate >= 4.7) {
    dist = { 5: 0.7, 4: 0.2, 3: 0.07, 2: 0.02, 1: 0.01 };
  } else if (targetAvgRate >= 4.3) {
    dist = { 5: 0.55, 4: 0.28, 3: 0.12, 2: 0.04, 1: 0.01 };
  } else if (targetAvgRate >= 3.8) {
    dist = { 5: 0.4, 4: 0.3, 3: 0.2, 2: 0.07, 1: 0.03 };
  } else if (targetAvgRate >= 3.3) {
    dist = { 5: 0.25, 4: 0.25, 3: 0.3, 2: 0.15, 1: 0.05 };
  } else {
    dist = { 5: 0.15, 4: 0.2, 3: 0.3, 2: 0.2, 1: 0.15 };
  }

  const result = {};
  for (const [rating, ratio] of Object.entries(dist)) {
    result[rating] = Math.max(1, Math.round(totalReviews * ratio));
  }

  // Điều chỉnh tổng số
  const sum = Object.values(result).reduce((a, b) => a + b, 0);
  if (sum !== totalReviews) {
    const diff = totalReviews - sum;
    result[5] += diff;
  }

  return result;
}

function randomDateInLastDays(days) {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

seedReviews().catch(err => {
  console.error('Lỗi seed reviews:', err);
  process.exit(1);
});