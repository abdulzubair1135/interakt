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
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, {
  timestamps: true
});

messageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema);
