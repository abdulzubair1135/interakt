const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  blocker: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  blocked: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure blocker cannot block the same user multiple times
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);
