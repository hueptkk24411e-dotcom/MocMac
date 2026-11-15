import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { Gift } from './models/Gift.js';

const sourceUrl = new URL('../data/gift.json', import.meta.url);
const gifts = JSON.parse(await readFile(sourceUrl, 'utf8'));

if (!Array.isArray(gifts)) {
  throw new Error('data/gift.json phải chứa một danh sách quà tặng.');
}

await mongoose.connect(process.env.MONGODB_URI);

try {
  const operations = [];
  for (const gift of gifts) {
    const document = new Gift(gift);
    await document.validate();
    operations.push({
      updateOne: {
        filter: { id: document.id },
        update: { $setOnInsert: document.toObject({ versionKey: false }) },
        upsert: true,
        timestamps: false,
      },
    });
  }

  if (operations.length) {
    const result = await Gift.bulkWrite(operations, { ordered: true });
    console.log(`Đã nạp ${result.upsertedCount} quà tặng mới từ data/gift.json.`);
  } else {
    console.log('data/gift.json không có quà tặng để nạp.');
  }
} finally {
  await mongoose.disconnect();
}
