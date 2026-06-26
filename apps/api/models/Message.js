const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group'
  },
  text: {
    type: String,
    required: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  media: {
    type: String
  },
  seen: {
    type: Boolean,
    default: false
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 27 * 60 * 60 * 1000) // 27 hours from now
  }
}, {
  timestamps: true
});

messageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// Filter out messages older than 24 hours from all find queries
messageSchema.pre(/^find/, function(next) {
  this.where({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  next();
});

module.exports = mongoose.model('Message', messageSchema);
