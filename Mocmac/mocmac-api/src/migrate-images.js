import 'dotenv/config';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { isImageUrl, productImagesWithUrls } from './utils/productImages.js';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const backupIndex = args.indexOf('--backup');
const backup = backupIndex === -1 ? null : args[backupIndex + 1];
assert.ok(!apply || (backup && !backup.startsWith('--')), 'Cần --backup <đường dẫn mới> trước khi cập nhật.');
assert.ok(process.env.MONGODB_URI, 'Thiếu MONGODB_URI.');

try {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 8000 });
  const products = mongoose.connection.db.collection('products');
  const rows = await products.find({}, { projection: { id: 1, images: 1, variants: 1 } }).toArray();
  const changes = [];
  const unresolved = new Set();

  for (const row of rows) {
    const next = productImagesWithUrls(row);
    const images = [...(next.images ?? []), ...(next.variants ?? []).flatMap(variant =>
      [variant?.image, ...(variant?.images ?? [])],
    )];
    if (images.some(image => image && !isImageUrl(image))) unresolved.add(row.id);

    const fields = {};
    for (const field of ['images', 'variants']) {
      if (JSON.stringify(row[field]) !== JSON.stringify(next[field])) fields[field] = next[field];
    }
    if (Object.keys(fields).length) changes.push({ row, fields });
  }

  let modified = 0;
  assert.ok(!apply || unresolved.size === 0, `Thiếu URL ảnh cho sản phẩm ${[...unresolved].join(', ')}.`);
  if (apply && changes.length) {
    const target = path.resolve(backup);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify(changes.map(({ row }) => row), null, 2) + '\n', { flag: 'wx' });
    const result = await products.bulkWrite(changes.map(({ row, fields }) => ({
      updateOne: {
        filter: { _id: row._id, ...Object.fromEntries(Object.keys(fields).map(field => [field, row[field]])) },
        update: { $set: fields },
      },
    })));
    assert.equal(result.matchedCount, changes.length, 'Dữ liệu đã thay đổi trong lúc cập nhật. Chạy kiểm tra lại.');
    modified = result.modifiedCount;
  }

  console.log(JSON.stringify({
    mode: apply ? 'applied' : 'dry-run',
    products: rows.length,
    planned: changes.length,
    modified,
    unresolved: [...unresolved],
  }, null, 2));
} finally {
  await mongoose.disconnect();
}
