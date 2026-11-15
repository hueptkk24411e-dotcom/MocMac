import { Review } from '../models/Review.js';

// Dữ liệu import dùng productId; review mới dùng tham chiếu product ObjectId.
export function reviewFilter(product) {
  return {
    status: { $ne: 'hidden' },
    $or: [{ product: product._id }, { productId: Number(product.id) }],
  };
}

export async function reviewStatsFor(products) {
  if (!products.length) return new Map();
  const validRating = { $and: [{ $gte: ['$rating', 1] }, { $lte: ['$rating', 5] }] };
  const rows = await Review.aggregate([
    {
      $match: {
        status: { $ne: 'hidden' },
        $or: [
          { product: { $in: products.map((p) => p._id) } },
          { productId: { $in: products.map((p) => Number(p.id)) } },
        ],
      },
    },
    {
      $group: {
        _id: { product: '$product', productId: '$productId' },
        count: { $sum: 1 },
        ratingTotal: { $sum: { $cond: [validRating, '$rating', 0] } },
        ratedCount: { $sum: { $cond: [validRating, 1, 0] } },
      },
    },
  ]);
  const stats = new Map();
  for (const product of products) {
    const matched = rows.filter((row) => row._id.product
      ? String(row._id.product) === String(product._id)
      : Number(row._id.productId) === Number(product.id));
    const count = matched.reduce((sum, row) => sum + row.count, 0);
    const ratedCount = matched.reduce((sum, row) => sum + row.ratedCount, 0);
    const total = matched.reduce((sum, row) => sum + row.ratingTotal, 0);
    stats.set(Number(product.id), { count, ratedCount, average: ratedCount ? Number((total / ratedCount).toFixed(1)) : 0 });
  }
  return stats;
}

export const emptyReviewStats = () => ({ count: 0, ratedCount: 0, average: 0 });
