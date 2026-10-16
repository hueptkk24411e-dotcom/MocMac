import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ' });
});

await connectDatabase();
console.log('Đã kết nối MongoDB');

app.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`));
