const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  ip: {
    type: String
  }
});

// Create index for sorting and filtering
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ userId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
