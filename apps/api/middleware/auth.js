const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

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

    // Premium status verification and auto-expiry
    if (user.premiumUntil && user.premiumUntil !== 'permanent') {
      if (new Date(user.premiumUntil) < new Date()) {
        user.isPremium = false;
        user.premiumUntil = null;
        await User.findByIdAndUpdate(user._id, { isPremium: false, premiumUntil: null });
      }
    }

    // Normalize: ensure both .id and ._id exist for compatibility
    user.id = user._id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
