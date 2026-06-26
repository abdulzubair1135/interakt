const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true // the one receiving the notification
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User' // the one who triggered it
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'message'],
    required: true
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
