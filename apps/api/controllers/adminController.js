const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Ad = require('../models/Ad');
const fs = require('fs');
const path = require('path');
const ActivityLog = require('../models/ActivityLog');
const OtpRequest = require('../models/OtpRequest');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete user (Ban)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Cannot delete legacy JSON accounts. Please refresh your page to see the updated database.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Delete all posts by this user
    await Post.deleteMany({ user: req.params.id });
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all activity logs
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).lean();
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all active password reset OTP requests
// @route   GET /api/admin/otp-requests
// @access  Private/Admin
exports.getOtpRequests = async (req, res) => {
  try {
    const activeRequests = await OtpRequest.find({
      expiresAt: { $gt: new Date() },
      verified: false
    }).lean();
    res.status(200).json({ success: true, count: activeRequests.length, data: activeRequests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Ban or Unban a user
// @route   POST /api/admin/users/:id/ban
// @access  Private/Admin
exports.banUser = async (req, res) => {
  try {
    const { duration } = req.body; // '3_days', '10_days', '1_month', 'permanent', 'none'
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot ban an admin user' });
    }

    let bannedUntil = null;
    let logMsg = '';
    
    if (duration === '3_days') {
      bannedUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      logMsg = 'Banned user for 3 days';
    } else if (duration === '10_days') {
      bannedUntil = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      logMsg = 'Banned user for 10 days';
    } else if (duration === '1_month') {
      bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      logMsg = 'Banned user for 1 month';
    } else if (duration === 'permanent') {
      bannedUntil = 'permanent';
      logMsg = 'Banned user permanently';
    } else {
      bannedUntil = null;
      logMsg = 'Unbanned user';
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { bannedUntil }, { new: true });
    const { logActivity } = require('../utils/activityLogger');
    await logActivity(req.user.id, req.user.username, 'ban_user', `${logMsg}: ${user.username}`, req.ip);

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().lean();
    const users = await User.find().lean();
    const populated = reports.map(r => ({
      ...r,
      senderUser: users.find(u => u._id.toString() === r.sender?.toString()) || { username: 'Unknown' },
      recipientUser: users.find(u => u._id.toString() === r.recipient?.toString()) || { username: 'Unknown' },
      reporterUser: users.find(u => u._id.toString() === r.reportedBy?.toString()) || { username: 'Unknown' }
    }));
    res.status(200).json({ success: true, count: populated.length, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete report
// @route   DELETE /api/admin/reports/:id
// @access  Private/Admin
exports.deleteReport = async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create advertisement
// @route   POST /api/admin/ads
// @access  Private/Admin
exports.createAd = async (req, res) => {
  try {
    const { company, title, description, image, link } = req.body;
    const ad = await Ad.create({
      company,
      title,
      description,
      image: image || '',
      link: link || '',
      clicks: 0,
      impressions: 0,
      isActive: true
    });
    const { logActivity } = require('../utils/activityLogger');
    await logActivity(req.user.id, req.user.username, 'create_ad', `Created ad: ${title} for ${company}`, req.ip);
    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete advertisement
// @route   DELETE /api/admin/ads/:id
// @access  Private/Admin
exports.deleteAd = async (req, res) => {
  try {
    await Ad.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get advertisements stats
// @route   GET /api/admin/ads/stats
// @access  Private/Admin
exports.getAdStats = async (req, res) => {
  try {
    const ads = await Ad.find().populate('clickedBy', 'username name email avatar').lean();
    res.status(200).json({ success: true, count: ads.length, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
