// routes/user.js - Basic user routes (profile, me)

const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current logged‑in user info
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user; // populated by auth middleware
    res.json({ id: user.id, role: user.role, email: user.email, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
