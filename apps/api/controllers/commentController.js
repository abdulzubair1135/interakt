const JSONStore = require('../utils/jsonStore');
const postStore = new JSONStore('posts');
const userStore = new JSONStore('users');
const { createNotification } = require('../utils/notifications');
const { logActivity } = require('../utils/activityLogger');

// Helper to populate user details for comments
const populateComments = async (comments) => {
  const users = await userStore.read();
  return comments.map(c => ({
    ...c,
    user: users.find(u => u._id === c.user) || { username: 'Deleted User', avatar: '' }
  }));
};

// @desc    Add a comment to a post
// @route   POST /api/comments/:postId
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const post = await postStore.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const comment = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      user: req.user.id,
      text: req.body.text,
      createdAt: new Date().toISOString()
    };

    const comments = [...(post.comments || []), comment];
    await postStore.findByIdAndUpdate(post._id, { comments });

    // Create notification
    if (post.user !== req.user.id) {
      await createNotification({
        user: post.user,
        sender: req.user.id,
        type: 'comment',
        post: post._id
      });
    }

    await logActivity(req.user.id, req.user.username, 'add_comment', `Commented on post: "${req.body.text.slice(0, 40)}${req.body.text.length > 40 ? '...' : ''}"`, req.ip);

    const populatedComments = await populateComments(comments);
    res.status(201).json({ success: true, data: populatedComments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Public
exports.getPostComments = async (req, res) => {
  try {
    const post = await postStore.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const comments = post.comments || [];
    const populatedComments = await populateComments(comments);
    
    // Sort descending by default
    populatedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: populatedComments.length, data: populatedComments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
