import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { Product } from './models/Product.js';
import { User } from './models/User.js';

const raw = JSON.parse(
  fs.readFileSync(
    new URL('../../my-app/public/data/product.json', import.meta.url),
    'utf8'
  )
);

await mongoose.connect(process.env.MONGODB_URI);

console.log('Đã kết nối MongoDB');

// =======================
// PRODUCTS
// =======================

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

// =======================
// ADMIN
// =======================

const adminEmail = (
  process.env.ADMIN_EMAIL ?? 'admin@mocmac.vn'
).toLowerCase();

if (!(await User.exists({ email: adminEmail }))) {

  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? 'Admin@12345',
    10
  );

  await User.create({
    name: 'Quản trị viên',
    email: adminEmail,
    passwordHash,
    role: 'admin',
  });

  console.log(`Đã tạo admin: ${adminEmail}`);
}

// =======================
// STAFF
// =======================

const staffEmail = (
  process.env.STAFF_EMAIL ?? 'staff@mocmac.vn'
).toLowerCase();

if (!(await User.exists({ email: staffEmail }))) {

  const passwordHash = await bcrypt.hash(
    process.env.STAFF_PASSWORD ?? 'Staff@12345',
    10
  );

  await User.create({
    name: 'Nhân viên Mộc Mạc',
    email: staffEmail,
    passwordHash,
    role: 'staff',
  });

  console.log(`Đã tạo staff: ${staffEmail}`);
}

await mongoose.disconnect();

console.log('Seed hoàn tất');