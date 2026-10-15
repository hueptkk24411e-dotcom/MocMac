import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Product } from './models/Product.js';
import { User } from './models/User.js';

const raw = JSON.parse(
  fs.readFileSync(new URL('../../my-app/public/data/product.json', import.meta.url), 'utf8')
);

await mongoose.connect(process.env.MONGODB_URI);

const products = raw.map((product) => ({
  ...product,
  village: product.village ?? '',
  occasion: Array.isArray(product.occasion)
    ? product.occasion
    : product.occasion
      ? [product.occasion]
      : [],
}));

await Product.deleteMany({});
await Product.insertMany(products);
console.log(`Đã nạp ${products.length} sản phẩm`);

const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@mocmac.vn').toLowerCase();
if (!(await User.exists({ email: adminEmail }))) {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'Admin@12345', 10);
  await User.create({
    name: 'Quản trị viên',
    email: adminEmail,
    passwordHash,
    role: 'admin',
  });
  console.log(`Đã tạo admin: ${adminEmail}`);
}

await mongoose.disconnect();
