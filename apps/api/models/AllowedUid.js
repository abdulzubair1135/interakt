const mongoose = require('mongoose');

const allowedUidSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  used: {
    type: Boolean,
    default: false
  },
  registeredUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AllowedUid', allowedUidSchema);
