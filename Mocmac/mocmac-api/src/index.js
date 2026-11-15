import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ChatMessage } from './models/ChatMessage.js';
import route from './routes/route.js';
import { hostedProductImage, isImageUrl } from './utils/productImages.js';
import { uploadsDirectory } from './utils/uploadStorage.js';

const app = express();
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

app.use('/uploads', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const source = hostedProductImage(req.baseUrl + req.path);
  if (isImageUrl(source)) return res.redirect(source);
  next();
});
app.use('/uploads', express.static(uploadsDirectory));

const frontendOrigins = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({ origin: frontendOrigins }));
app.use(express.json());
app.use('/api/provinces', async (_req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://provinces.open-api.vn/api/v2/p/');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy provinces error:', error);
    res.status(502).json({ message: 'Không thể lấy danh sách tỉnh.' });
  }
});

app.use('/api/districts', async (_req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const provinceCode = _req.query.province;
    if (!provinceCode) {
      return res.status(400).json({ message: 'Thiếu mã tỉnh.' });
    }
    const response = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${provinceCode}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy districts error:', error);
    res.status(502).json({ message: 'Không thể lấy danh sách quận/huyện.' });
  }
});

app.use('/api', route);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ' });
});

await mongoose.connect(process.env.MONGODB_URI);
console.log('Đã kết nối MongoDB');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: frontendOrigins, methods: ['GET', 'POST', 'PATCH'] },
});

const userSocketMap = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  const guestId = socket.handshake.query?.guestId;
  if (!token) {
    socket.data.userId = guestId || 'guest_' + socket.id;
    socket.data.role = 'guest';
    socket.data.guest = true;
    return next();
  }
  try {
    const payload = jwt.verify(String(token), process.env.JWT_SECRET);
    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    socket.data.guest = false;
    next();
  } catch (err) {
    socket.data.userId = guestId || 'guest_' + socket.id;
    socket.data.role = 'guest';
    socket.data.guest = true;
    next();
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const isGuest = socket.data.guest;

  if (!isGuest) {
    userSocketMap.set(String(userId), socket.id);
  }

  socket.join('user_' + userId);
  if (socket.data.role === 'admin' || socket.data.role === 'staff') {
    socket.join('admin_room');
  }

  socket.on('chat:send', async ({ to, message }) => {
    if (!message || !message.trim()) return;

    const doc = await ChatMessage.create({
      from: userId,
      to,
      message: message.trim(),
    });

    const payload = {
      _id: doc._id,
      from: doc.from,
      to: doc.to,
      message: doc.message,
      read: doc.read,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    if (to === 'admin') {
      socket.to('admin_room').emit('chat:message', payload);
    } else {
      socket.to('user_' + to).emit('chat:message', payload);
      socket.to('admin_room').emit('chat:message', payload);
    }

    socket.emit('chat:message', payload);
  });

  socket.on('chat:mark-read', async ({ from }) => {
    await ChatMessage.updateMany(
      { from, to: userId, read: false },
      { $set: { read: true } },
    );
    socket.to('user_' + from).emit('chat:mark-read', { from: userId, to: from });
  });

  socket.on('disconnect', () => {
    if (!isGuest) {
      userSocketMap.delete(String(userId));
    }
  });
});

export { io, userSocketMap };

httpServer.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`));
