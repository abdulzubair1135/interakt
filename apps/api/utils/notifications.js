const JSONStore = require('./jsonStore');
const notifStore = new JSONStore('notifications');

exports.createNotification = async ({ user, sender, type, post }) => {
  try {
    // Don't notify if the user is the same as the sender
    if (user && sender && user.toString() === sender.toString()) return;

    await notifStore.create({
      user,
      sender,
      type,
      post,
      isRead: false
    });
    console.log(`🔔 Notification created: ${type} for user ${user}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
