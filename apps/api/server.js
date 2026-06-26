require('dotenv').config({ path: require('path').join(__dirname, '.env') });
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

// Route imports
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// ── CORS Whitelist ──────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

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
const mongoose = require('mongoose');

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
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

// ── Socket.IO Auth Middleware ───────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'secret');
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
  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('join_chat', (room) => {
    socket.join(room);
  });

  socket.on('send_message', (data) => {
    // ── Message Validation ──────────────────────────────────────────────
    if (!data || typeof data.text !== 'string') {
      return socket.emit('error', { message: 'Invalid message: text is required and must be a string.' });
    }
    if (data.text.length > 2000) {
      return socket.emit('error', { message: 'Message too long. Maximum 2000 characters.' });
    }
    // Sanitize – strip HTML tags
    data.text = stripHtml(data.text);

    const targetRoom = data.room || data.chatId;
    if (targetRoom) {
      io.to(targetRoom).emit('receive_message', data);
    } else {
      io.emit('receive_message', data);
    }
  });

  socket.on('new_post', (data) => {
    io.emit('post_update', data);
  });

  socket.on('disconnect', () => {
    // connection closed
  });
});

// ── Auto-Delete Job ─────────────────────────────────────────────────────────
const autoDeleteJob = async () => {
  try {
    const now = Date.now();
    const age24h = 24 * 60 * 60 * 1000;
    const age27h = 27 * 60 * 60 * 1000;

    // 1. Delete Posts older than 24h
    const postsPath = path.join(__dirname, 'data/posts.json');
    if (fs.existsSync(postsPath)) {
      try {
        const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
        const originalCount = posts.length;
        const activePosts = posts.filter(
          (p) => now - new Date(p.createdAt).getTime() < age24h
        );
        if (activePosts.length < originalCount) {
          fs.writeFileSync(postsPath, JSON.stringify(activePosts, null, 2));
        }
      } catch (e) {
        console.error('Error auto-deleting posts:', e.message);
      }
    }

    // 2. Delete Messages older than 24h
    const messagesPath = path.join(__dirname, 'data/messages.json');
    if (fs.existsSync(messagesPath)) {
      try {
        const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
        const originalCount = messages.length;
        const activeMessages = messages.filter(
          (m) => now - new Date(m.createdAt).getTime() < age24h
        );
        if (activeMessages.length < originalCount) {
          fs.writeFileSync(messagesPath, JSON.stringify(activeMessages, null, 2));
        }
      } catch (e) {
        console.error('Error auto-deleting messages:', e.message);
      }
    }

    // 3. Delete Uploaded files older than 27h
    const uploadsDir = path.join(__dirname, 'public/uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;
        if (age > age27h) {
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch (err) {
    console.error('Error in autoDeleteJob:', err.message);
  }
};

// Run cleanup immediately on start, and then every 10 minutes
autoDeleteJob();
setInterval(autoDeleteJob, 10 * 60 * 1000);

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
