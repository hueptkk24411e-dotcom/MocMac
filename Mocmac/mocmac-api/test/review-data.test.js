import { afterEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Product } from '../src/models/Product.js';
import { Review } from '../src/models/Review.js';
import { reviewStatsFor } from '../src/utils/reviewData.js';
import { getProductReviews } from '../src/controllers/reviewController.js';

afterEach(() => mock.restoreAll());
const product = { _id: new mongoose.Types.ObjectId(), id: 2 };
function query(value) {
  const result = {};
  for (const key of ['populate', 'sort', 'skip', 'limit']) result[key] = () => result;
  result.lean = async () => value;
  return result;
}
function response() {
  return { statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
}

test('combines imported productId reviews with ObjectId-based reviews without using product counters', async () => {
  mock.method(Review, 'aggregate', async (pipeline) => {
    assert.deepEqual(pipeline[0].$match.status, { $ne: 'hidden' });
    assert.ok(pipeline[0].$match.$or.some((item) => item.productId?.$in.includes(2)));
    return [
      { _id: { productId: 2 }, count: 2, ratedCount: 2, ratingTotal: 9 },
      { _id: { product: product._id }, count: 1, ratedCount: 1, ratingTotal: 3 },
    ];
  });
  const stats = await reviewStatsFor([product, { _id: new mongoose.Types.ObjectId(), id: 3 }]);
  assert.deepEqual(stats.get(2), { count: 3, ratedCount: 3, average: 4 });
  assert.deepEqual(stats.get(3), { count: 0, ratedCount: 0, average: 0 });
});

test('review pagination returns collection-wide totals and the original imported content', async () => {
  const stored = [{ _id: 'test-review', productId: 2, userName: 'Lê Thu Hà', rating: 5, content: 'Đóng gói cẩn thận, sản phẩm nhận được rất ổn.', createdAt: '2026-10-18T09:15:00Z', isDemo: true }];
  mock.method(Product, 'findOne', () => query(product));
  mock.method(Review, 'find', (filter) => {
    assert.equal(filter.$or[1].productId, 2);
    assert.deepEqual(filter.status, { $ne: 'hidden' });
    return query(stored);
  });
  mock.method(Review, 'aggregate', async () => [{ _id: { productId: 2 }, count: 22, ratedCount: 22, ratingTotal: 99 }]);
  const res = response();
  await getProductReviews({ params: { id: '2' }, query: { page: '2', limit: '10' } }, res);
  assert.equal(res.body.total, 22);
  assert.equal(res.body.avgRating, 4.5);
  assert.equal(res.body.page, 2);
  assert.equal(res.body.totalPages, 3);
  assert.deepEqual(res.body.reviews, stored);
});

test('an empty collection has zero reviews and an invalid product id returns an error', async () => {
  mock.method(Product, 'findOne', () => query(product));
  mock.method(Review, 'find', () => query([]));
  mock.method(Review, 'aggregate', async () => []);
  const res = response();
  await getProductReviews({ params: { id: '2' }, query: {} }, res);
  assert.equal(res.body.avgRating, 0);
  assert.equal(res.body.total, 0);
  assert.deepEqual(res.body.reviews, []);
  const invalid = response();
  await getProductReviews({ params: { id: 'abc' }, query: {} }, invalid);
  assert.equal(invalid.statusCode, 400);
});
