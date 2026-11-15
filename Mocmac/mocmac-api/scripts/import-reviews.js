import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const args = process.argv.slice(2);
const input = args.find((arg) => !arg.startsWith('--'));
const apply = args.includes('--apply');
const reportIndex = args.indexOf('--report');
const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : null;
if (!input) throw new Error('Cần đường dẫn reviews.json. Mặc định chỉ kiểm tra, thêm --apply để nhập.');
if (apply && !reportPath) throw new Error('Cần --report <path> để lưu bản đối chiếu trước khi nhập.');

const supplied = JSON.parse((await fs.readFile(path.resolve(input), 'utf8')).replace(/^\uFEFF/, ''));
assert.ok(Array.isArray(supplied), 'Dữ liệu phải là một mảng JSON.');
const identity = (row) => JSON.stringify([
  Number(row.productId), row.userName, row.content, new Date(row.createdAt).toISOString(),
]);

try {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 8000 });
  const collection = mongoose.connection.db.collection('reviews');
  const productIds = new Set((await mongoose.connection.db.collection('products').find({}, { projection: { id: 1 } }).toArray()).map((p) => Number(p.id)));
  for (const row of supplied) {
    assert.ok(productIds.has(Number(row.productId)), `Không tìm thấy sản phẩm ${row.productId}.`);
    assert.ok(Number.isInteger(row.rating) && row.rating >= 1 && row.rating <= 5, 'Số sao không hợp lệ.');
    assert.ok(typeof row.userName === 'string' && row.userName.trim(), 'Thiếu tên người đánh giá.');
    assert.ok(typeof row.content === 'string' && row.content.trim(), 'Thiếu nội dung nhận xét.');
    assert.ok(Number.isFinite(new Date(row.createdAt).getTime()), 'Ngày nhận xét không hợp lệ.');
  }
  assert.equal(new Set(supplied.map(identity)).size, supplied.length, 'File JSON có bản ghi trùng nhau.');
  const existing = await collection.find({}).toArray();
  const indexes = await collection.indexes();
  const known = new Set(existing.filter((row) => row.productId && row.userName && row.content && row.createdAt).map(identity));
  const missing = supplied.filter((row) => !known.has(identity(row)));
  const report = {
    database: mongoose.connection.name,
    source: path.resolve(input),
    supplied: supplied.length,
    existing: existing.length,
    missing: missing.length,
    previousIndexes: indexes,
    previousReviews: existing,
    insertedIds: [],
  };

  if (apply) {
    await fs.mkdir(path.dirname(path.resolve(reportPath)), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), { flag: 'wx' });
    await collection.createIndex({ product: 1, user: 1 }, {
      name: 'review_user_product_unique', unique: true,
      partialFilterExpression: { product: { $type: 'objectId' }, user: { $type: 'objectId' } },
    });
    const oldIndex = indexes.find((index) => index.name === 'product_1_user_1' && index.unique && !index.partialFilterExpression);
    if (oldIndex) await collection.dropIndex(oldIndex.name);
    await collection.createIndex({ productId: 1, createdAt: -1 });
    if (missing.length) {
      const inserted = await collection.insertMany(missing);
      report.insertedIds = Object.values(inserted.insertedIds).map(String);
    }
    report.totalAfter = await collection.countDocuments({});
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify({ mode: apply ? 'applied' : 'dry-run', supplied: supplied.length, existing: existing.length, missing: missing.length, inserted: report.insertedIds.length, totalAfter: report.totalAfter, reportPath }, null, 2));
} finally {
  await mongoose.disconnect();
}
