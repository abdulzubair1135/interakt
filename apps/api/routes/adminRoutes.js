const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { 
  getAllUsers, deleteUser, deletePost, getActivityLogs, getOtpRequests,
  banUser, getReports, deleteReport, createAd, deleteAd, getAdStats
} = require('../controllers/adminController');

const router = express.Router();

// Apply protect and admin authorization to all routes in this file
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/ban', banUser);
router.delete('/posts/:id', deletePost);
router.get('/logs', getActivityLogs);
router.get('/otp-requests', getOtpRequests);

router.get('/reports', getReports);
router.delete('/reports/:id', deleteReport);

router.post('/ads', createAd);
router.delete('/ads/:id', deleteAd);
router.get('/ads/stats', getAdStats);

module.exports = router;
