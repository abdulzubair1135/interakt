const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, username, action, details = '', ip = '127.0.0.1') => {
  try {
    // Log to console for debugging
    console.log(`📝 Activity logged: [${action}] ${username || 'System'} - ${details}`);

    await ActivityLog.create({
      userId: userId || 'system',
      username: username || 'System',
      action,
      details,
      ip
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = { logActivity };
