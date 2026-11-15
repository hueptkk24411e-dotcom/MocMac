import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Gift } from '../src/models/Gift.js';

const gifts = JSON.parse(await readFile(new URL('../data/gift.json', import.meta.url), 'utf8'));

test('gift.json records validate against the MongoDB Gift model', async () => {
  assert.equal(Gift.collection.collectionName, 'gifts');
  assert.equal(gifts.length, 12);

  for (const gift of gifts) {
    await new Gift(gift).validate();
  }
});

test('Gift model rejects invalid prices and ratings', async () => {
  await assert.rejects(new Gift({ id: 100, name: 'Quà lỗi', price: -1 }).validate());
  await assert.rejects(new Gift({ id: 101, name: 'Quà lỗi', price: 1, rate: 6 }).validate());
});
