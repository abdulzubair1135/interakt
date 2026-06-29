const express = require('express');
const { 
  getGlobalMessages, sendGlobalMessage, 
  getPersonalMessages, sendPersonalMessage, createGroupChat,
  getConversations, getGroupMessages, sendGroupMessage,
  deleteMessage, reportMessage, joinGroup, getGroupDetails, leaveGroup
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', protect, getConversations);

router.route('/global')
  .get(protect, getGlobalMessages)
  .post(protect, sendGlobalMessage);

router.route('/personal/:recipientId')
  .get(protect, getPersonalMessages)
  .post(protect, sendPersonalMessage);

router.post('/group', protect, createGroupChat);

router.get('/group/:groupId/details', protect, getGroupDetails);
router.post('/group/:groupId/leave', protect, leaveGroup);

router.route('/group/:groupId')
  .get(protect, getGroupMessages)
  .post(protect, sendGroupMessage);

router.post('/group/:groupId/join', protect, joinGroup);
router.delete('/:messageId', protect, deleteMessage);
router.post('/:messageId/report', protect, reportMessage);

module.exports = router;
