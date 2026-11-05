import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/routes/products.js';
import { Review } from '../src/models/Review.js';

async function call(path, method, req = {}) {
  const handler = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack[0].handle;
  const response = { code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ params: {}, query: {}, ...req }, response);
  return response;
}

test('detail rejects an invalid numeric ID before querying MongoDB', async () => {
  assert.equal((await call('/:id', 'get', { params: { id: 'wrong' } })).code, 400);
});

test('review validation rejects short names and invalid stars', async () => {
  const params = { id: '1' };
  assert.equal((await call('/:id/reviews', 'post', { params, body: { userName: 'A', content: 'Good', rating: 5 } })).code, 400);
  assert.equal((await call('/:id/reviews', 'post', { params, body: { userName: 'Anna', content: 'Good', rating: 7 } })).code, 400);
});

test('reviews without a rating do not become five-star reviews', async () => {
  const original = Review.find;
  Review.find = () => ({ sort: () => ({ lean: async () => [{ _id: 'r1', productId: 1, rating: null }] }) });
  try {
    const response = await call('/:id/reviews', 'get', { params: { id: '1' } });
    assert.equal(response.body.reviews[0].rating, null);
  } finally { Review.find = original; }
});

test('catalog summary rounds the average and preserves unrated review count', async () => {
  const original = Review.aggregate;
  Review.aggregate = async () => [{ _id: 1, count: 3, average: 4.666, ratedCount: 2 }];
  try {
    const response = await call('/review-stats', 'get');
    assert.deepEqual(response.body, { 1: { count: 3, average: 4.7, ratedCount: 2 } });
  } finally { Review.aggregate = original; }
});
