import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

// Updates descriptions only. The default run validates the catalog without writing.
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const backupIndex = args.indexOf('--backup');
const backupPath = backupIndex >= 0 ? args[backupIndex + 1] : null;
if (apply && !backupPath) throw new Error('Cần --backup <path> để sao lưu trước khi cập nhật.');
const source = new URL('../data/product-descriptions.json', import.meta.url);
const supplied = JSON.parse((await fs.readFile(source, 'utf8')).replace(/^\uFEFF/, ''));
assert.ok(Array.isArray(supplied) && supplied.length > 0, 'Danh sách mô tả trống.');
assert.equal(new Set(supplied.map((row) => row.id)).size, supplied.length, 'Trùng mã sản phẩm.');
for (const row of supplied) {
  assert.ok(Number.isSafeInteger(row.id) && row.id > 0, 'Mã sản phẩm không hợp lệ.');
  assert.ok(typeof row.name === 'string' && row.name.trim(), `Thiếu tên sản phẩm ${row.id}.`);
  assert.ok(typeof row.description === 'string' && row.description.trim().length >= 400, `Mô tả sản phẩm ${row.id} quá ngắn.`);
  assert.ok(row.description.split(/\n\s*\n/).length >= 3, `Mô tả sản phẩm ${row.id} cần chia đoạn.`);
}

try {
  assert.ok(process.env.MONGODB_URI, 'Chưa cấu hình MONGODB_URI.');
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 8000 });
  const collection = mongoose.connection.db.collection('products');
  const products = await collection.find({}).toArray();
  const byId = new Map(products.map((product) => [product.id, product]));
  assert.equal(byId.size, products.length, 'Danh mục có mã sản phẩm bị trùng.');
  const changes = [];
  let alreadyCurrent = 0;
  let preserved = 0;
  for (const row of supplied) {
    const product = byId.get(row.id);
    assert.ok(product, `Không tìm thấy sản phẩm ${row.id}.`);
    assert.equal(product.name, row.name, `Tên sản phẩm ${row.id} đã thay đổi; cần kiểm tra lại.`);
    const description = row.description.trim();
    if (product.description === description) { alreadyCurrent++; continue; }
    // Retain descriptions the shop has written rather than overwrite them on reruns.
    if (String(product.description || product.story || '').trim()) { preserved++; continue; }
    changes.push({ product, description });
  }
  const sourceIds = new Set(supplied.map((row) => row.id));
  const uncovered = products.filter((product) => !sourceIds.has(product.id)).map((product) => product.id);
  assert.equal(uncovered.length, 0, `Còn sản phẩm chưa có nội dung: ${uncovered.join(', ')}.`);

  const report = {
    mode: apply ? 'applied' : 'dry-run',
    createdAt: new Date().toISOString(),
    supplied: supplied.length,
    catalog: products.length,
    planned: changes.length,
    alreadyCurrent,
    preserved,
    modified: 0,
    previous: changes.map(({ product }) => ({
      _id: String(product._id), id: product.id, name: product.name,
      descriptionPresent: Object.hasOwn(product, 'description'),
      description: product.description ?? null,
    })),
  };

  if (apply) {
    const target = path.resolve(backupPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, JSON.stringify(report, null, 2), { flag: 'wx' });
    if (changes.length) {
      const operations = changes.map(({ product, description }) => ({
        updateOne: {
          filter: {
            _id: product._id, id: product.id, name: product.name,
            description: Object.hasOwn(product, 'description') ? product.description : { $exists: false },
          },
          update: { $set: { description } },
        },
      }));
      const result = await collection.bulkWrite(operations, { ordered: true });
      report.modified = result.modifiedCount;
      await fs.writeFile(target, JSON.stringify(report, null, 2));
      assert.equal(result.matchedCount, changes.length, 'Dữ liệu thay đổi trong lúc cập nhật; kiểm tra bản sao lưu.');
    }
    const after = await collection.find({ id: { $in: supplied.map((row) => row.id) } }).toArray();
    assert.ok(after.every((product) => String(product.description || product.story || '').trim()), 'Còn sản phẩm thiếu mô tả sau cập nhật.');
  }
  const { previous, ...summary } = report;
  console.log(JSON.stringify({ ...summary, backupPath: apply ? path.resolve(backupPath) : null }, null, 2));
} finally {
  await mongoose.disconnect();
}
