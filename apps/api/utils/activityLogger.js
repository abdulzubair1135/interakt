const fs = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '../data/activity_logs.json');

const logActivity = async (userId, username, action, details, ip = '127.0.0.1') => {
  try {
    const logDir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let logs = [];
    if (fs.existsSync(LOGS_FILE)) {
      try {
        const fileContent = fs.readFileSync(LOGS_FILE, 'utf8');
        logs = JSON.parse(fileContent);
      } catch (err) {
        logs = [];
      }
    }

    const newLog = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      userId: userId || null,
      username: username || 'Guest',
      action,
      details,
      ip,
      timestamp: new Date().toISOString()
    };

    logs.unshift(newLog); // Keep latest logs at the top
    
    // Limit logs size to 2000 items to prevent file bloat
    if (logs.length > 2000) {
      logs = logs.slice(0, 2000);
    }

    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
    console.log(`📝 Activity logged: [${action}] ${username} - ${details}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = { logActivity };
