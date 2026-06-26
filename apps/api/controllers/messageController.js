const JSONStore = require('../utils/jsonStore');
const messageStore = new JSONStore('messages');
const userStore = new JSONStore('users');
const groupStore = new JSONStore('groups');
const { logActivity } = require('../utils/activityLogger');

const populateSender = async (msgs) => {
  const users = await userStore.read();
  return msgs.map(m => ({
    ...m,
    sender: users.find(u => u._id === m.sender) || { username: 'Deleted User', avatar: '' },
    viewedByUsers: (m.viewedBy || []).map(uid => {
      const u = users.find(usr => usr._id === uid);
      return u ? { _id: u._id, username: u.username, avatar: u.avatar } : null;
    }).filter(Boolean)
  }));
};

exports.getGlobalMessages = async (req, res) => {
  try {
    let msgs = await messageStore.find({ isGlobal: true });
    msgs = await populateSender(msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(-50));
    res.status(200).json({ success: true, data: msgs });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.sendGlobalMessage = async (req, res) => {
  try {
    const msg = await messageStore.create({
      text: req.body.text,
      sender: req.user.id,
      isGlobal: true
    });
    const populated = await populateSender([msg]);
    await logActivity(req.user.id, req.user.username, 'send_global_msg', `Sent global message: "${req.body.text.slice(0, 40)}${req.body.text.length > 40 ? '...' : ''}"`, req.ip);
    res.status(201).json({ success: true, data: populated[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getPersonalMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipientId = req.params.recipientId;
    const allMsgs = await messageStore.read();
    
    // Mark recipient's messages to me as viewed by me
    let changed = false;
    const updatedMsgs = allMsgs.map(m => {
      if (m.recipient === userId && m.sender === recipientId) {
        const viewedBy = m.viewedBy || [];
        if (!viewedBy.includes(userId)) {
          viewedBy.push(userId);
          changed = true;
          return { ...m, viewedBy };
        }
      }
      return m;
    });
    
    if (changed) {
      await messageStore.write(updatedMsgs);
    }

    let msgs = updatedMsgs.filter(m => 
      (m.sender === userId && m.recipient === recipientId) || 
      (m.sender === recipientId && m.recipient === userId)
    );

    msgs = await populateSender(msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    res.status(200).json({ success: true, data: msgs });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.sendPersonalMessage = async (req, res) => {
  try {
    const msg = await messageStore.create({
      text: req.body.text,
      sender: req.user.id,
      recipient: req.params.recipientId,
      isGlobal: false
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
    const group = await groupStore.create({
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
    const allMsgs = await messageStore.read();
    
    // Mark messages not sent by me in this group as viewed by me
    let changed = false;
    const updatedMsgs = allMsgs.map(m => {
      if (m.groupId === req.params.groupId && m.sender !== userId) {
        const viewedBy = m.viewedBy || [];
        if (!viewedBy.includes(userId)) {
          viewedBy.push(userId);
          changed = true;
          return { ...m, viewedBy };
        }
      }
      return m;
    });

    if (changed) {
      await messageStore.write(updatedMsgs);
    }

    let msgs = updatedMsgs.filter(m => m.groupId === req.params.groupId);
    msgs = await populateSender(msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    res.status(200).json({ success: true, data: msgs });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.sendGroupMessage = async (req, res) => {
  try {
    const msg = await messageStore.create({
      text: req.body.text,
      sender: req.user.id,
      groupId: req.params.groupId,
      isGlobal: false
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
    const allMsgs = await messageStore.read();
    const allUsers = await userStore.read();
    const allGroups = await groupStore.read();

    // 1. Get personal conversations
    const personalMsgs = allMsgs.filter(m => 
      !m.isGlobal && !m.groupId && (m.sender === userId || m.recipient === userId)
    );

    const personalChatsMap = new Map();
    // Sort oldest first so that the latest message overwrites and becomes the stored value
    personalMsgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    personalMsgs.forEach(m => {
      const otherId = m.sender === userId ? m.recipient : m.sender;
      personalChatsMap.set(otherId, m);
    });

    const personalConversations = [];
    for (const [otherId, lastMsg] of personalChatsMap.entries()) {
      const user = allUsers.find(u => u._id === otherId);
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
    const userGroups = allGroups.filter(g => g.members && g.members.includes(userId));
    const groupConversations = [];

    for (const group of userGroups) {
      const groupMsgs = allMsgs.filter(m => m.groupId === group._id);
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
    const msg = await messageStore.findById(req.params.messageId);
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    // User can delete their own message. Admin can delete any message.
    if (msg.sender !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this message' });
    }
    
    await messageStore.findByIdAndDelete(req.params.messageId);
    await logActivity(req.user.id, req.user.username, 'delete_msg', `Deleted message: "${msg.text.slice(0, 30)}"`, req.ip);
    
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.reportMessage = async (req, res) => {
  try {
    const { reason } = req.body;
    const msg = await messageStore.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found' });

    const reportStore = new JSONStore('reports');
    const report = await reportStore.create({
      messageId: msg._id,
      text: msg.text,
      sender: msg.sender,
      recipient: msg.recipient,
      reportedBy: req.user.id,
      reason: reason || 'Inappropriate content',
      createdAt: new Date().toISOString()
    });

    await logActivity(req.user.id, req.user.username, 'report_message', `Reported message: "${msg.text.slice(0, 30)}"`, req.ip);
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const group = await groupStore.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    const members = group.members || [];
    if (members.includes(req.user.id)) {
      return res.status(200).json({ success: true, data: group });
    }
    group.members = [...members, req.user.id];
    await groupStore.findByIdAndUpdate(group._id, { members: group.members });
    res.status(200).json({ success: true, data: group });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
