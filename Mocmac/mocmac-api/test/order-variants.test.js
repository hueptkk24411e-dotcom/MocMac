import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceOrderItems } from '../src/utils/orderItems.js';
import { Order } from '../src/models/Order.js';

const product = { id: 8, name: 'Bộ ấm trà', price: 724000, inStock: true, variants: [
  { id: 'xanh', label: 'Men xanh', price: 724000, available: true, attributes: [{ name: 'Màu sắc', value: 'Xanh lam' }] },
  { id: 'trang', label: 'Men trắng', price: 740000, available: true, attributes: [{ name: 'Màu sắc', value: 'Trắng' }] },
  { id: 'het-hang', label: 'Men nâu', price: 740000, available: false, attributes: [] },
] };

test('server prices and snapshots each selected version independently', () => {
  const result = priceOrderItems([
    { productId: 8, variantId: 'xanh', name: 'fake', price: 1, quantity: 2 },
    { productId: 8, variantId: 'trang', price: 1, quantity: 1 },
  ], [product]);
  assert.equal(result.subtotal, 2188000);
  assert.deepEqual(result.items.map(item => [item.variantId, item.variantLabel, item.price]), [['xanh','Men xanh',724000],['trang','Men trắng',740000]]);
  const order = new Order({ items: result.items, subtotal: result.subtotal, total: result.subtotal });
  assert.equal(order.validateSync(), undefined);
  assert.equal(order.items[1].variantLabel, 'Men trắng');
  assert.equal(order.items[1].attributes[0].value, 'Trắng');
});

test('rejects missing, invented and unavailable versions without creating an order', () => {
  for (const variantId of [undefined, 'invented', 'het-hang']) {
    assert.throws(() => priceOrderItems([{ productId: 8, variantId, quantity: 1 }], [product]), error => error.statusCode === 400);
  }
});

test('retains products without variants and rejects invalid quantities or stock', () => {
  const plain = { id: 1, name: 'Trà', price: 100000, inStock: true };
  assert.equal(priceOrderItems([{ productId: 1, quantity: 2, price: 1 }], [plain]).subtotal, 200000);
  for (const quantity of [0, -1, 1.2, 100]) assert.throws(() => priceOrderItems([{ productId: 1, quantity }], [plain]));
  assert.throws(() => priceOrderItems([{ productId: 1, quantity: 1 }], [{ ...plain, inStock: false }]));
});
