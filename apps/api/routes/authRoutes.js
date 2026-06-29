const express = require('express');
const { 
  register, login, getMe, getUserProfile, setupAdmin, googleAuth, 
  searchUsers, toggleFollow, updateDetails, getTrendingUsers, 
  getFollowingUsers, setPremium, togglePrivate, getNotifications, 
  markNotificationsRead, getFollowers, getFollowing,
  forgotPassword, verifyResetOtp, getActiveAds, trackAdClick, logInspectAttempt,
  blockUser, unblockUser, getBlockedUsers, getUserAnalytics
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' }
});

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-reset-otp', authLimiter, verifyResetOtp);
router.get('/me', protect, getMe);
router.get('/profile/:id', getUserProfile);
router.get('/profile/:id/analytics', protect, getUserAnalytics);
router.get('/profile/:id/followers', getFollowers);
router.get('/profile/:id/following', getFollowing);
router.post('/setup-admin', protect, setupAdmin);
router.post('/google', googleAuth);
router.get('/search', searchUsers);
router.put('/:id/follow', protect, toggleFollow);
router.put('/updatedetails', protect, updateDetails);
router.get('/trending', getTrendingUsers);
router.get('/following', protect, getFollowingUsers);
router.put('/:id/premium', protect, authorize('admin'), setPremium);
router.put('/toggleprivate', protect, togglePrivate);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);

router.post('/:id/block', protect, blockUser);
router.post('/:id/unblock', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);

router.get('/ads', getActiveAds);
router.post('/ads/:id/click', protect, trackAdClick);
router.post('/log-inspect', logInspectAttempt);

module.exports = router;
