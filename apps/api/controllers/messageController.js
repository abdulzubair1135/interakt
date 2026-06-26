const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const Report = require('../models/Report');
const { logActivity } = require('../utils/activityLogger');
const { filterProfanity } = require('../utils/profanityFilter');

const populateSender = async (msgs) => {
  const users = await User.find().lean();
  return msgs.map(m => {
    const msgObj = m.toObject ? m.toObject() : m;
    return {
      ...msgObj,
      sender: users.find(u => u._id.toString() === msgObj.sender?.toString()) || { username: 'Deleted User', avatar: '' },
      viewedByUsers: (msgObj.viewedBy || []).map(uid => {
        const u = users.find(usr => usr._id.toString() === uid.toString());
        return u ? { _id: u._id, username: u.username, avatar: u.avatar } : null;
      }).filter(Boolean)
    };
  });
};

exports.getGlobalMessages = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let msgs = await Message.find({ isGlobal: true, createdAt: { $gte: twentyFourHoursAgo } }).sort({ createdAt: 1 });
    msgs = msgs.slice(-50);
    msgs = await populateSender(msgs);
    res.status(200).json({ success: true, data: msgs });
  } catch (err) {
    console.error('getGlobalMessages ERROR:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.sendGlobalMessage = async (req, res) => {
  try {
    const filteredText = filterProfanity(req.body.text);
    const msg = await Message.create({
      text: filteredText,
      sender: req.user.id,
      isGlobal: true,
      expireAt: new Date(Date.now() + 27 * 60 * 60 * 1000)
    });
    const populated = await populateSender([msg]);
    await logActivity(req.user.id, req.user.username, 'send_global_msg', `Sent global message: "${filteredText.slice(0, 40)}${filteredText.length > 40 ? '...' : ''}"`, req.ip);
    res.status(201).json({ success: true, data: populated[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getPersonalMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipientId = req.params.recipientId;
    
    // Mark recipient's messages to me as viewed by me
    await Message.updateMany(
      { receiver: userId, sender: recipientId, viewedBy: { $ne: userId } },
      { $push: { viewedBy: userId } }
    );

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let msgs = await Message.find({
      $or: [
        { sender: userId, receiver: recipientId },
        { sender: recipientId, receiver: userId }
      ],
      createdAt: { $gte: twentyFourHoursAgo }
    }).sort({ createdAt: 1 });

    msgs = await populateSender(msgs);
    res.status(200).json({ success: true, data: msgs });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.sendPersonalMessage = async (req, res) => {
  try {
    const filteredText = filterProfanity(req.body.text);
    const msg = await Message.create({
      text: filteredText,
      sender: req.user.id,
      receiver: req.params.recipientId,
      isGlobal: false,
      expireAt: new Date(Date.now() + 27 * 60 * 60 * 1000)
    });
    const populated = await populateSender([msg]);
    await logActivity(req.user.id, req.user.username, 'send_personal_msg', `Sent personal message to user ${req.params.recipientId}`, req.ip);
    res.status(201).json({ success: true, data: populated[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.createGroupChat = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const group = await Group.create({
      name,
      description,
      admin: req.user.id,
      members: [req.user.id, ...(members || [])]
    });
    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mark messages not sent by me in this group as viewed by me
    await Message.updateMany(
      { group: req.params.groupId, sender: { $ne: userId }, viewedBy: { $ne: userId } },
      { $push: { viewedBy: userId } }
    );

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let msgs = await Message.find({ group: req.params.groupId, createdAt: { $gte: twentyFourHoursAgo } }).sort({ createdAt: 1 });
    msgs = await populateSender(msgs);
    res.status(200).json({ success: true, data: msgs });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.sendGroupMessage = async (req, res) => {
  try {
    const filteredText = filterProfanity(req.body.text);
    const msg = await Message.create({
      text: filteredText,
      sender: req.user.id,
      group: req.params.groupId,
      isGlobal: false,
      expireAt: new Date(Date.now() + 27 * 60 * 60 * 1000)
    });
    const populated = await populateSender([msg]);
    res.status(201).json({ success: true, data: populated[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allMsgs = await Message.find({ createdAt: { $gte: twentyFourHoursAgo } }).lean();
    const allUsers = await User.find().lean();
    const allGroups = await Group.find().lean();

    // 1. Get personal conversations
    const personalMsgs = allMsgs.filter(m => 
      !m.isGlobal && !m.group && (m.sender?.toString() === userId || m.receiver?.toString() === userId)
    );

    const personalChatsMap = new Map();
    // Sort oldest first so that the latest message overwrites and becomes the stored value
    personalMsgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    personalMsgs.forEach(m => {
      const otherId = m.sender?.toString() === userId ? m.receiver?.toString() : m.sender?.toString();
      personalChatsMap.set(otherId, m);
    });

    const personalConversations = [];
    for (const [otherId, lastMsg] of personalChatsMap.entries()) {
      const user = allUsers.find(u => u._id.toString() === otherId);
      if (user) {
        personalConversations.push({
          id: user._id,
          name: user.username,
          avatar: user.avatar,
          isGlobal: false,
          isGroup: false,
          lastMessage: lastMsg.text,
          time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lastMessageAt: lastMsg.createdAt
        });
      }
    }

    // 2. Get group conversations
    const isAdmin = req.user.role === 'admin';
    const userGroups = allGroups.filter(g => isAdmin || (g.members && g.members.map(id => id.toString()).includes(userId)));
    const groupConversations = [];

    for (const group of userGroups) {
      const groupMsgs = allMsgs.filter(m => m.group?.toString() === group._id.toString());
      let lastMsgText = 'Group created';
      let lastMsgTime = new Date(group.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let lastMsgAt = group.createdAt;

      if (groupMsgs.length > 0) {
        // Sort to get latest
        groupMsgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        lastMsgText = groupMsgs[0].text;
        lastMsgTime = new Date(groupMsgs[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastMsgAt = groupMsgs[0].createdAt;
      }

      groupConversations.push({
        id: group._id,
        name: group.name,
        avatar: '',
        isGlobal: false,
        isGroup: true,
        lastMessage: lastMsgText,
        time: lastMsgTime,
        lastMessageAt: lastMsgAt
      });
    }

    // Merge and sort all conversations by latest message timestamp
    const allConversations = [...personalConversations, ...groupConversations];
    allConversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.status(200).json({ success: true, data: allConversations });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    // User can delete their own message. Admin can delete any message.
    if (msg.sender.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this message' });
    }
    
    await Message.findByIdAndDelete(req.params.messageId);
    await logActivity(req.user.id, req.user.username, 'delete_msg', `Deleted message: "${msg.text.slice(0, 30)}"`, req.ip);
    
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.reportMessage = async (req, res) => {
  try {
    const { reason } = req.body;
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });

    const report = await Report.create({
      messageId: msg._id,
      text: msg.text,
      sender: msg.sender,
      recipient: msg.receiver,
      reportedBy: req.user.id,
      reason: reason || 'Inappropriate content',
      createdAt: new Date()
    });

    await logActivity(req.user.id, req.user.username, 'report_message', `Reported message: "${msg.text.slice(0, 30)}"`, req.ip);
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    const members = group.members || [];
    if (members.map(id => id.toString()).includes(req.user.id)) {
      return res.status(200).json({ success: true, data: group });
    }
    group.members.push(req.user.id);
    await group.save();
    res.status(200).json({ success: true, data: group });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
