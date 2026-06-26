const User = require('../models/User');
const Notification = require('../models/Notification');
const Ad = require('../models/Ad');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createNotification } = require('../utils/notifications');
const fs = require('fs');
const path = require('path');
const { logActivity } = require('../utils/activityLogger');

// ──────────────────────────────────────────────────────────────
// SECURITY: JWT_SECRET startup validation (Fix #2)
// ──────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is not set. ' +
    'The server MUST NOT start without a strong JWT secret.'
  );
}
const JWT_SECRET = process.env.JWT_SECRET;

// ──────────────────────────────────────────────────────────────
// SECURITY: Input sanitization helper (Fix #3)
// ──────────────────────────────────────────────────────────────
const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

// ──────────────────────────────────────────────────────────────
// SECURITY: Safe user fields – prevents data leaks (Fix #9,10,11)
// ──────────────────────────────────────────────────────────────
const SAFE_PUBLIC_FIELDS = ['_id', 'username', 'avatar', 'bio', 'followers', 'isPremium'];

const pickSafePublicFields = (user) => {
  const safe = {};
  for (const key of SAFE_PUBLIC_FIELDS) {
    if (user[key] !== undefined) safe[key] = user[key];
  }
  return safe;
};

const SAFE_PRIVATE_FIELDS = [
  '_id', 'username', 'name', 'nickname', 'emoji', 'email', 'uid', 'phone',
  'avatar', 'bio', 'role', 'isPremium', 'isPrivate',
  'followers', 'following', 'lastLogin', 'createdAt',
  'premiumUntil', 'coverImage', 'bannedUntil'
];

const pickSafePrivateFields = (user) => {
  const safe = {};
  for (const key of SAFE_PRIVATE_FIELDS) {
    if (user[key] !== undefined) safe[key] = user[key];
  }
  return safe;
};

// Custom password hashing removed in favor of Mongoose pre-save hooks

// ──────────────────────────────────────────────────────────────
// SECURITY: Validation helpers (Fixes #4, #5, #6)
// ──────────────────────────────────────────────────────────────
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must contain at least one letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please provide a valid email address';
  }
  return null;
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!username || !usernameRegex.test(username)) {
    return 'Username must be 3-30 characters and contain only letters, numbers, and underscores';
  }
  return null;
};

// ──────────────────────────────────────────────────────────────
// SECURITY: Login rate limiter – in-memory (Fix #12)
// ──────────────────────────────────────────────────────────────
const loginAttempts = new Map(); // key: IP, value: { count, firstAttempt, lastAttempt }
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

const checkLoginRateLimit = (ip) => {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) return { allowed: true, delayMs: 0 };

  // Reset window if expired
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true, delayMs: 0 };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    // Exponential backoff: 2^(count - MAX) seconds, capped at 5 min
    const exponent = record.count - MAX_LOGIN_ATTEMPTS;
    const delayMs = Math.min(Math.pow(2, exponent) * 1000, 5 * 60 * 1000);
    const timeSinceLast = now - record.lastAttempt;
    if (timeSinceLast < delayMs) {
      const waitSeconds = Math.ceil((delayMs - timeSinceLast) / 1000);
      return { allowed: false, delayMs, waitSeconds };
    }
  }

  return { allowed: true, delayMs: 0 };
};

const recordFailedLogin = (ip) => {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS)) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now, lastAttempt: now });
  } else {
    record.count += 1;
    record.lastAttempt = now;
  }
};

const clearLoginAttempts = (ip) => {
  loginAttempts.delete(ip);
};

// ──────────────────────────────────────────────────────────────
// SECURITY: OTP brute-force tracking (Fix #14)
// ──────────────────────────────────────────────────────────────
const otpAttempts = new Map(); // key: userId, value: { count, firstAttempt }
const MAX_OTP_ATTEMPTS = 3;
const OTP_ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes (matches OTP expiry)

// ──────────────────────────────────────────────────────────────
// SECURITY: Generic error message for production (Fix #13)
// ──────────────────────────────────────────────────────────────
const safeErrorMessage = (err) => {
  if (process.env.NODE_ENV === 'production') {
    return 'An internal error occurred';
  }
  return err.message || 'An internal error occurred';
};

// ──────────────────────────────────────────────────────────────
// Token response helper
// ──────────────────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: '30d'
  });

  const displayName = user.isPrivate 
    ? `User_${user._id.slice(-3)}` 
    : (user.name || user.username);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      _id: user._id,
      username: user.username,
      displayName,
      email: user.email,
      uid: user.uid,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      isPremium: user.isPremium,
      isPrivate: user.isPrivate,
      followers: user.followers || [],
      following: user.following || []
    }
  });
};

// ──────────────────────────────────────────────────────────────
// REGISTER (Fixes #1, #3, #4, #5, #6, #13)
// ──────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    console.log('Registering user:', req.body.email);
    const username = sanitize(req.body.username);
    const email = sanitize(req.body.email);
    const password = req.body.password; // don't sanitize passwords – it may strip valid chars
    const uid = sanitize(req.body.uid);
    const phone = sanitize(req.body.phone);

    if (!uid || !phone) {
      return res.status(400).json({ success: false, error: 'College UID and Phone Number are required' });
    }

    // Validation (Fixes #4, #5, #6)
    const usernameErr = validateUsername(username);
    if (usernameErr) return res.status(400).json({ success: false, error: usernameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ success: false, error: emailErr });

    const passwordErr = validatePassword(password);
    if (passwordErr) return res.status(400).json({ success: false, error: passwordErr });

    // Read allowed UIDs
    const allowedUidsPath = path.join(__dirname, '../data/allowed_uids.json');
    let allowedUids = [];
    if (fs.existsSync(allowedUidsPath)) {
      allowedUids = JSON.parse(fs.readFileSync(allowedUidsPath, 'utf8'));
    }

    if (!allowedUids.includes(uid.trim())) {
      return res.status(400).json({ success: false, error: 'Your College UID is not registered/authorized. Outsiders are not allowed!' });
    }

    const existingUser = await User.findOne({
      $or: [
        { email },
        { username },
        { uid: uid.trim() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User, Email, or College UID already exists' });
    }

    const user = await User.create({
      username,
      email,
      uid: uid.trim(),
      phone: phone.trim(),
      password,
      name: '',
      nickname: '',
      emoji: '🎓',
      avatar: '',
      bio: '',
      role: 'user',
      isPremium: false,
      isPrivate: false,
      followers: [],
      following: [],
      lastLogin: new Date()
    });

    console.log('User created successfully:', user._id);
    await logActivity(user._id, user.username, 'register', `User registered successfully with College UID: ${uid}`, req.ip);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, error: safeErrorMessage(err) });
  }
};

// ──────────────────────────────────────────────────────────────
// LOGIN (Fixes #1, #3, #12, #13)
// ──────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email: rawEmail, identifier, password } = req.body;
    const searchVal = sanitize(identifier || rawEmail || '');

    if (!searchVal || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email/UID/phone and password' });
    }

    // Rate limit check (Fix #12)
    const clientIp = req.ip || '127.0.0.1';
    const rateCheck = checkLoginRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many login attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`
      });
    }

    const searchRegex = new RegExp(`^${searchVal}$`, 'i');
    const user = await User.findOne({
      $or: [
        { email: searchRegex },
        { phone: searchVal },
        { uid: searchRegex },
        { username: searchRegex }
      ]
    }).select('+password');

    if (!user) {
      recordFailedLogin(clientIp);
      await logActivity(null, 'Guest', 'login_fail', `Failed login attempt for identifier: ${sanitize(searchVal)}`, req.ip);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    let passwordValid = false;
    if (typeof user.matchPassword === 'function') {
      passwordValid = await user.matchPassword(password);
    }

    if (!passwordValid) {
      recordFailedLogin(clientIp);
      await logActivity(user._id, user.username, 'login_fail', `Failed login attempt (incorrect password)`, req.ip);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Clear rate limit on success
    clearLoginAttempts(clientIp);

    // Ban check
    if (user.bannedUntil) {
      if (user.bannedUntil === 'permanent') {
        return res.status(403).json({ success: false, error: 'Your account is permanently banned.' });
      }
      const banDate = new Date(user.bannedUntil);
      if (banDate > new Date()) {
        const remaining = Math.ceil((banDate.getTime() - Date.now()) / (1000 * 60 * 60));
        return res.status(403).json({ success: false, error: `Your account is banned. ${remaining} hours remaining.` });
      }
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    await logActivity(user._id, user.username, 'login', `User logged in successfully`, req.ip);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, error: safeErrorMessage(err) });
  }
};

// ──────────────────────────────────────────────────────────────
// GET ME (Fix #11 – filter sensitive fields, Fix #13)
// ──────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: pickSafePrivateFields(user) });
  } catch (err) {
    res.status(400).json({ success: false, error: safeErrorMessage(err) });
  }
};

// ──────────────────────────────────────────────────────────────
// GET USER PROFILE
// ──────────────────────────────────────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const currentUserId = req.user ? req.user.id : null;
    const isFollowing = (user.followers || []).includes(currentUserId);
    const isOwner = currentUserId === user._id;

    let profileData = {
      _id: user._id,
      id: user._id,
      username: user.username,
      name: user.name,
      emoji: user.emoji,
      avatar: user.avatar,
      bio: user.bio || 'CampusHub Member',
      followers: user.followers || [],
      following: user.following || [],
      isPremium: user.isPremium,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt
    };

    if (user.isPrivate && !isFollowing && !isOwner) {
      const maskedId = user._id.slice(-3);
      profileData.username = `User_${maskedId}`;
      profileData.name = `User_${maskedId}`;
      profileData.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${maskedId}`;
      profileData.bio = 'This account is private';
      profileData.isLocked = true;
    }

    res.status(200).json({ success: true, data: profileData });
  } catch (err) {
    res.status(400).json({ success: false, error: safeErrorMessage(err) });
  }
};

// ──────────────────────────────────────────────────────────────
// TOGGLE FOLLOW
// ──────────────────────────────────────────────────────────────
exports.toggleFollow = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) return res.status(404).json({ success: false, error: 'User not found' });
    if (userToFollow._id === currentUser._id) return res.status(400).json({ success: false, error: 'Cannot follow yourself' });

    const isFollowing = (currentUser.following || []).includes(userToFollow._id);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id !== userToFollow._id);
      userToFollow.followers = userToFollow.followers.filter(id => id !== currentUser._id);
    } else {
      currentUser.following = [...(currentUser.following || []), userToFollow._id];
      userToFollow.followers = [...(userToFollow.followers || []), currentUser._id];
    }

    await User.findByIdAndUpdate(currentUser._id, { following: currentUser.following });
    await User.findByIdAndUpdate(userToFollow._id, { followers: userToFollow.followers });

    if (!isFollowing) {
      await createNotification({
        user: userToFollow._id,
        sender: currentUser._id,
        type: 'follow'
      });
    }

    res.status(200).json({ success: true, isFollowing: !isFollowing, followersCount: userToFollow.followers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// UPDATE DETAILS (Fix #3 – sanitize inputs)
// ──────────────────────────────────────────────────────────────
exports.updateDetails = async (req, res) => {
  try {
    const allowedFields = ['username', 'name', 'nickname', 'bio', 'emoji', 'avatar', 'coverImage'];
    const updates = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = sanitize(req.body[f]);
    });

    // Validate username if being updated
    if (updates.username) {
      const usernameErr = validateUsername(updates.username);
      if (usernameErr) return res.status(400).json({ success: false, error: usernameErr });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.status(200).json({ success: true, data: pickSafePrivateFields(user) });
  } catch (error) {
    res.status(400).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// SEARCH USERS (Fix #3, #9 – sanitize query, filter output)
// ──────────────────────────────────────────────────────────────
exports.searchUsers = async (req, res) => {
  try {
    const q = sanitize(req.query.q || '');
    if (!q) return res.status(200).json({ success: true, data: [] });
    const users = await User.find({ username: { $regex: q, $options: 'i' } })
      .limit(20)
      .then(res => res.map(pickSafePublicFields));
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// GET TRENDING USERS (Fix #10 – filter output)
// ──────────────────────────────────────────────────────────────
exports.getTrendingUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ lastLogin: -1 })
      .limit(3)
      .then(res => res.map(pickSafePublicFields));
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// GET FOLLOWING USERS
// ──────────────────────────────────────────────────────────────
exports.getFollowingUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const following = await User.find({ _id: { $in: currentUser.following || [] } });
    res.status(200).json({ success: true, data: following.map(pickSafePublicFields) });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// TOGGLE PRIVATE
// ──────────────────────────────────────────────────────────────
exports.togglePrivate = async (req, res) => {
  try {
    const isPrivate = req.body.isPrivate !== undefined ? req.body.isPrivate : true;
    const user = await User.findByIdAndUpdate(req.user.id, { isPrivate }, { new: true });
    res.status(200).json({ success: true, isPrivate: user.isPrivate });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// GET NOTIFICATIONS
// ──────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('sender')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// MARK NOTIFICATIONS READ
// ──────────────────────────────────────────────────────────────
exports.markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// GET FOLLOWERS
// ──────────────────────────────────────────────────────────────
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const followers = await User.find({ _id: { $in: user.followers || [] } });
    res.status(200).json({ success: true, data: followers.map(pickSafePublicFields) });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// GET FOLLOWING
// ──────────────────────────────────────────────────────────────
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const following = await User.find({ _id: { $in: user.following || [] } });
    res.status(200).json({ success: true, data: following.map(pickSafePublicFields) });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// SETUP ADMIN (Fix #7 – CRITICAL: require ADMIN_SECRET)
// ──────────────────────────────────────────────────────────────
exports.setupAdmin = async (req, res) => {
  try {
    const { adminSecret } = req.body;

    if (!process.env.ADMIN_SECRET) {
      console.error('ADMIN_SECRET environment variable is not configured.');
      return res.status(500).json({ success: false, error: 'Admin setup is not configured on this server.' });
    }

    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      await logActivity(req.user.id, req.user.username || 'Unknown', 'admin_setup_fail', 'Unauthorized admin setup attempt', req.ip);
      return res.status(403).json({ success: false, error: 'Invalid admin secret. This attempt has been logged.' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { role: 'admin' }, { new: true });
    await logActivity(req.user.id, user.username, 'admin_setup', 'User promoted to admin role', req.ip);
    res.status(200).json({ success: true, data: pickSafePrivateFields(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// ──────────────────────────────────────────────────────────────
// GOOGLE AUTH (Fix #8 – validate token claims instead of blind decode)
// ──────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    const { token: googleToken } = req.body;
    console.log('Google Auth login requested');

    if (!googleToken) {
      return res.status(400).json({ success: false, error: 'Google token is required' });
    }

    let email, name, picture;
    try {
      const decoded = jwt.decode(googleToken, { complete: true });
      if (!decoded || !decoded.payload) {
        return res.status(400).json({ success: false, error: 'Invalid Google token structure' });
      }

      const payload = decoded.payload;

      // Fix #8: Validate issuer
      const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
      if (!validIssuers.includes(payload.iss)) {
        console.error('Google token issuer mismatch:', payload.iss);
        return res.status(401).json({ success: false, error: 'Invalid Google token issuer' });
      }

      // Fix #8: Validate audience matches our client ID
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        console.error('GOOGLE_CLIENT_ID environment variable is not set');
        return res.status(500).json({ success: false, error: 'Google Auth is not configured on this server' });
      }
      if (payload.aud !== googleClientId) {
        console.error('Google token audience mismatch:', payload.aud);
        return res.status(401).json({ success: false, error: 'Google token audience mismatch' });
      }

      // Fix #8: Validate expiration
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp < nowInSeconds) {
        return res.status(401).json({ success: false, error: 'Google token has expired' });
      }

      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } catch (e) {
      console.error('Error decoding google token:', e);
      return res.status(400).json({ success: false, error: 'Failed to decode Google token' });
    }

    if (!email) {
      return res.status(400).json({ success: false, error: 'Invalid Google token: no email found' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const username = sanitize(email.split('@')[0]) + '_' + crypto.randomBytes(2).toString('hex');
      user = await User.create({
        username,
        email: sanitize(email),
        password: crypto.randomBytes(32).toString('hex'),
        name: sanitize(name || ''),
        nickname: '',
        emoji: '🎓',
        avatar: sanitize(picture || ''),
        bio: '',
        role: 'user',
        isPremium: false,
        isPrivate: false,
        followers: [],
        following: [],
        lastLogin: new Date()
      });
    } else {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, error: safeErrorMessage(err) });
  }
};

// ──────────────────────────────────────────────────────────────
// SET PREMIUM
// ──────────────────────────────────────────────────────────────
exports.setPremium = async (req, res) => {
  try {
    const { isPremium, duration } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    let premiumUntil = null;
    let isPremiumValue = false;
    let logMsg = '';

    if (duration) {
      if (duration === '1_hour') {
        premiumUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        isPremiumValue = true;
        logMsg = 'Granted premium status for 1 hour';
      } else if (duration === '1_day') {
        premiumUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        isPremiumValue = true;
        logMsg = 'Granted premium status for 1 day';
      } else if (duration === '7_days') {
        premiumUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        isPremiumValue = true;
        logMsg = 'Granted premium status for 7 days';
      } else if (duration === '30_days') {
        premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        isPremiumValue = true;
        logMsg = 'Granted premium status for 30 days';
      } else if (duration === 'permanent') {
        premiumUntil = 'permanent';
        isPremiumValue = true;
        logMsg = 'Granted premium status permanently';
      } else {
        premiumUntil = null;
        isPremiumValue = false;
        logMsg = 'Removed premium status';
      }
    } else {
      isPremiumValue = !!isPremium;
      premiumUntil = isPremiumValue ? 'permanent' : null;
      logMsg = isPremiumValue ? 'Granted premium status' : 'Removed premium status';
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { 
      isPremium: isPremiumValue,
      premiumUntil
    }, { new: true });

    await logActivity(req.user.id, req.user.username, 'set_premium', `${logMsg} for ${user.username}`, req.ip);
    res.status(200).json({ success: true, data: pickSafePrivateFields(updatedUser) });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// @desc    Get all active ads
// @route   GET /api/auth/ads
// @access  Public
exports.getActiveAds = async (req, res) => {
  try {
    const activeAds = await Ad.find({ isActive: true });
    
    // Increment impressions
    await Ad.updateMany({ isActive: true }, { $inc: { impressions: 1 } });
    
    res.status(200).json({ success: true, data: activeAds });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// @desc    Track ad click
// @route   POST /api/auth/ads/:id/click
// @access  Public
exports.trackAdClick = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    if (!ad) {
      return res.status(404).json({ success: false, error: 'Ad not found' });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// @desc    Log security inspect attempt
// @route   POST /api/auth/log-inspect
// @access  Public
exports.logInspectAttempt = async (req, res) => {
  try {
    const username = sanitize(req.body.username || '');
    const details = sanitize(req.body.details || '');
    let ip = req.ip || '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);

    // Dynamic IP Geolocation lookup
    let location = 'Local Network';
    if (ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('192.168.')) {
      try {
        const axios = require('axios');
        const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
        if (geoRes.data && geoRes.data.status === 'success') {
          location = `${geoRes.data.city}, ${geoRes.data.regionName}, ${geoRes.data.country}`;
        }
      } catch (geoErr) {
        location = 'Unknown Location';
      }
    }

    await logActivity(
      null, 
      username || 'Hacker/Unknown', 
      'inspect_attempt', 
      `INSPECT DEVTOOLS DETECTED! Loc: ${location}. Details: ${details || 'None'}`, 
      req.ip
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};


// @desc    Request password reset OTP (offline admin flow)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const identifier = sanitize(req.body.identifier || '');
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Please provide email, UID, phone, or username' });
    }

    const searchVal = identifier.trim();
    const searchRegex = new RegExp(`^${searchVal}$`, 'i');
    const user = await User.findOne({
      $or: [
        { email: searchRegex },
        { phone: searchVal },
        { uid: searchRegex },
        { username: searchRegex }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this identifier' });
    }

    // Generate 6-digit random OTP using crypto for better randomness
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins expiry

    const otpFile = path.join(__dirname, '../data/otp_requests.json');
    let requests = [];
    if (fs.existsSync(otpFile)) {
      requests = JSON.parse(fs.readFileSync(otpFile, 'utf8'));
    }

    // Remove any existing active otp requests for this user to keep it clean
    requests = requests.filter(r => r.userId !== user._id);

    const newRequest = {
      _id: Date.now().toString() + crypto.randomBytes(4).toString('hex'),
      userId: user._id,
      username: user.username,
      uid: user.uid || '',
      phone: user.phone || '',
      email: user.email || '',
      otp,
      expiresAt,
      createdAt: new Date().toISOString(),
      verified: false,
      attempts: 0 // Fix #14: track verification attempts
    };

    requests.push(newRequest);
    fs.writeFileSync(otpFile, JSON.stringify(requests, null, 2));

    // Log the request activity
    await logActivity(user._id, user.username, 'forgot_password_request', `Requested password reset. OTP generated for admin approval.`, req.ip);

    res.status(200).json({
      success: true,
      message: 'Reset request registered. Please ask the Admin for your 6-digit OTP code.'
    });
  } catch (error) {
    console.error('Forgot Password Request Error:', error);
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/verify-reset-otp
// @access  Public (Fix #14 – OTP brute force protection)
exports.verifyResetOtp = async (req, res) => {
  try {
    const identifier = sanitize(req.body.identifier || '');
    const otp = sanitize(req.body.otp || '');
    const newPassword = req.body.newPassword; // don't sanitize passwords

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please provide identifier, OTP, and new password' });
    }

    // Validate new password strength
    const passwordErr = validatePassword(newPassword);
    if (passwordErr) return res.status(400).json({ success: false, error: passwordErr });

    const searchVal = identifier.trim();
    const searchRegex = new RegExp(`^${searchVal}$`, 'i');
    const user = await User.findOne({
      $or: [
        { email: searchRegex },
        { phone: searchVal },
        { uid: searchRegex },
        { username: searchRegex }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const otpFile = path.join(__dirname, '../data/otp_requests.json');
    if (!fs.existsSync(otpFile)) {
      return res.status(400).json({ success: false, error: 'No active OTP requests found' });
    }

    const requests = JSON.parse(fs.readFileSync(otpFile, 'utf8'));
    const requestIndex = requests.findIndex(r => 
      r.userId === user._id && 
      new Date(r.expiresAt) > new Date() && 
      !r.verified
    );

    if (requestIndex === -1) {
      return res.status(400).json({ success: false, error: 'No active OTP request found. Please request a new one.' });
    }

    const otpRequest = requests[requestIndex];

    // Fix #14: Check brute-force attempt count
    if ((otpRequest.attempts || 0) >= MAX_OTP_ATTEMPTS) {
      // Invalidate the OTP entirely
      requests[requestIndex].verified = true; // mark as used so it can't be retried
      fs.writeFileSync(otpFile, JSON.stringify(requests, null, 2));
      await logActivity(user._id, user.username, 'otp_brute_force', 'OTP invalidated after too many failed attempts', req.ip);
      return res.status(400).json({ success: false, error: 'Too many failed OTP attempts. This OTP has been invalidated. Please request a new one.' });
    }

    // Check if OTP matches
    if (otpRequest.otp !== otp.trim()) {
      // Increment attempt counter
      requests[requestIndex].attempts = (otpRequest.attempts || 0) + 1;
      fs.writeFileSync(otpFile, JSON.stringify(requests, null, 2));

      const remaining = MAX_OTP_ATTEMPTS - requests[requestIndex].attempts;
      await logActivity(user._id, user.username, 'otp_verify_fail', `Failed OTP verification attempt (${requests[requestIndex].attempts}/${MAX_OTP_ATTEMPTS})`, req.ip);
      return res.status(400).json({ 
        success: false, 
        error: `Invalid OTP. ${remaining} attempt(s) remaining before invalidation.` 
      });
    }

    // OTP is correct - update password
    user.password = newPassword;
    await user.save();

    // Mark OTP as verified/used
    requests[requestIndex].verified = true;
    fs.writeFileSync(otpFile, JSON.stringify(requests, null, 2));

    await logActivity(user._id, user.username, 'password_reset_success', `Reset password successfully using admin OTP`, req.ip);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully! You can now log in.'
    });
  } catch (error) {
    console.error('Verify OTP Reset Error:', error);
    res.status(500).json({ success: false, error: safeErrorMessage(error) });
  }
};
