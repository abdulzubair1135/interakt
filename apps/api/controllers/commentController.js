const Post = require('../models/Post');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');
const { logActivity } = require('../utils/activityLogger');

// @desc    Add a comment to a post
// @route   POST /api/comments/:postId
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const comment = {
      user: req.user.id,
      text: req.body.text
    };

    post.comments.push(comment);
    await post.save();

    // Create notification
    if (post.user.toString() !== req.user.id) {
      await createNotification({
        user: post.user,
        sender: req.user.id,
        type: 'comment',
        post: post._id
      });
    }

    await logActivity(req.user.id, req.user.username, 'add_comment', `Commented on post: "${req.body.text.slice(0, 40)}${req.body.text.length > 40 ? '...' : ''}"`, req.ip);

    const populatedPost = await Post.findById(post._id).populate('comments.user', 'username name avatar isPrivate');
    const populatedComments = populatedPost.comments;

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
    const post = await Post.findById(req.params.postId).populate('comments.user', 'username name avatar isPrivate');
    
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const populatedComments = post.comments || [];
    
    // Sort descending by default
    populatedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: populatedComments.length, data: populatedComments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
