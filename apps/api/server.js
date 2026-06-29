require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');

// Route imports
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.set('trust proxy', 1); // Trust first proxy for Render
const server = http.createServer(app);

// ── CORS Whitelist ──────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://interakt-app.netlify.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});
global.io = io;

// ── Request ID ──────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ── Helmet Hardening ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", ...allowedOrigins],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' },
  })
);

// ── Extra Security Headers (ensure completeness beyond helmet) ──────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ── Body Parsing (2 MB default) ─────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// ── 5 MB limit for upload routes only ───────────────────────────────────────
const uploadBodyLimit = express.json({ limit: '5mb' });

// ── HPP – HTTP Parameter Pollution Protection ───────────────────────────────
app.use((req, res, next) => {
  /* HPP: collapse array params to last value */
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][req.query[key].length - 1];
    }
  }
  next();
});

// ── Static Files ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── General Rate Limiter (5000 req / 15 min) ────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ── Strict Auth Rate Limiter (10 req / 15 min) ─────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

// ── DB Connection ───────────────────────────────────────────────────────────
// Connects to MongoDB if MONGO_URI is set, else defaults to JSON files

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected successfully');
      
      // Run one-time UID migration
      const runUidMigration = require('./migrateUids');
      runUidMigration();

      const seedAdmin = async () => {
        try {
          const adminExists = await User.findOne({ email: 'admin@interakt.pro' });
          if (!adminExists) {
            const admin = new User({
              username: 'admin',
              name: 'Super Admin',
              email: 'admin@interakt.pro',
              password: 'Interakt@Admin_X2_Secure_99$!',
              role: 'admin'
            });
            await admin.save();
            console.log('High-security admin account created successfully.');
          }
        } catch (err) {
          console.error('Error seeding admin account:', err);
        }
      };
      seedAdmin();
    })
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGO_URI provided. Running with local JSON database.');
}

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// APK Download Route
app.get('/api/download/apk', (req, res) => {
  res.download(path.join(__dirname, 'public/uploads/interakt.apk'), 'interakt-app.apk');
});

// ── Socket.IO Auth Middleware ───────────────────────────────────────────────
const onlineUsers = new Map(); // userId -> Set of socket.ids
global.onlineUsers = onlineUsers;

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.userId = decoded.id;
    next();
  } catch (e) {
    next(new Error('Invalid token'));
  }
});

// ── Utility: strip HTML tags ────────────────────────────────────────────────
function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

// ── Socket.io for Real-time features ────────────────────────────────────────
io.on('connection', (socket) => {
  if (socket.userId) {
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);
    io.emit('user_status', { userId: socket.userId, status: 'online' });
  }

  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('join_chat', (room) => {
    socket.join(room);
  });

  socket.on('send_message', (data) => {
    if (!data || typeof data.text !== 'string') {
      return socket.emit('error', { message: 'Invalid message: text is required and must be a string.' });
    }
    if (data.text.length > 2000) {
      return socket.emit('error', { message: 'Message too long. Maximum 2000 characters.' });
    }
    data.text = stripHtml(data.text);

    const targetRoom = data.room || data.chatId;
    if (targetRoom) {
      io.to(targetRoom).emit('receive_message', data);
    } else {
      io.emit('receive_message', data);
    }
  });

  // Typing Events
  socket.on('typing', (data) => {
    const targetRoom = data.chatId;
    if (targetRoom) {
      socket.to(targetRoom).emit('user_typing', data);
    }
  });

  socket.on('stop_typing', (data) => {
    const targetRoom = data.chatId;
    if (targetRoom) {
      socket.to(targetRoom).emit('user_stop_typing', data);
    }
  });

  socket.on('read_message', async (data) => {
    const { chatId, userId } = data;
    if (!chatId || !userId) return;
    try {
      await Message.updateMany(
        { 
          $or: [
            { receiver: userId, sender: chatId },
            { group: chatId, sender: { $ne: userId } }
          ],
          viewedBy: { $ne: userId }
        },
        { $push: { viewedBy: userId } }
      );
      io.to(chatId === 'global' ? 'global_room' : chatId).emit('message_read', { chatId, userId });
    } catch (err) {
      console.error(err);
    }
  });

  // Check online statuses
  socket.on('check_online_status', (userIds) => {
    if (Array.isArray(userIds)) {
      const statuses = userIds.map(id => ({
        userId: id,
        status: onlineUsers.has(id) ? 'online' : 'offline'
      }));
      socket.emit('online_statuses', statuses);
    }
  });

  socket.on('new_post', (data) => {
    io.emit('post_update', data);
  });

  socket.on('disconnect', () => {
    if (socket.userId && onlineUsers.has(socket.userId)) {
      const userSockets = onlineUsers.get(socket.userId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(socket.userId);
        io.emit('user_status', { userId: socket.userId, status: 'offline' });
      }
    }
  });
});


// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Server Error' : err.message,
  });
});

// ── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io, authLimiter, uploadBodyLimit };
