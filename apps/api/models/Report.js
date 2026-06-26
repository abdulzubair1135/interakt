const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  },
  text: String,
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  reportedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  reason: {
    type: String,
    default: 'Inappropriate content'
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
