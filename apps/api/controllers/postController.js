const Post = require('../models/Post');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');
const { logActivity } = require('../utils/activityLogger');

const { filterProfanity } = require('../utils/profanityFilter');

exports.getPosts = async (req, res) => {
  try {
    const query = {};
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }

    const currentUserId = req.user ? req.user.id : null;
    let allowedIds = [];
    
    // Privacy filter
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      const followingIds = currentUser ? (currentUser.following || []) : [];
      const publicUsers = await User.find({ isPrivate: false }).select('_id');
      const publicUserIds = publicUsers.map(u => u._id);
      allowedIds = [...publicUserIds, ...followingIds, currentUserId];
    } else {
      const publicUsers = await User.find({ isPrivate: false }).select('_id');
      allowedIds = publicUsers.map(u => u._id);
    }

    query.user = { $in: allowedIds };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'username name avatar isPrivate isPremium');

    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      text: filterProfanity(req.body.text),
      user: req.user.id,
      expireAt: new Date(Date.now() + 27 * 60 * 60 * 1000)
    };
    const post = await Post.create(postData);
    const populated = await Post.findById(post._id).populate('user', 'username name avatar isPrivate isPremium');
    
    await logActivity(req.user.id, req.user.username, 'create_post', `Created post: "${post.text.slice(0, 50)}${post.text.length > 50 ? '...' : ''}"`, req.ip);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    if (!isLiked) {
      await createNotification({
        user: post.user,
        sender: userId,
        type: 'like',
        post: post._id
      });
    }

    res.status(200).json({ success: true, liked: !isLiked, data: post.likes });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const userId = req.user.id;
    const isSaved = post.saves.includes(userId);

    if (isSaved) {
      post.saves.pull(userId);
    } else {
      post.saves.push(userId);
    }

    await post.save();
    res.status(200).json({ success: true, saved: !isSaved, data: post.saves });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const currentUserId = req.user ? req.user.id : null;
    const isFollowing = user.followers.includes(currentUserId);
    const isOwner = currentUserId === req.params.userId;

    if (user.isPrivate && !isFollowing && !isOwner) {
      return res.status(200).json({ success: true, count: 0, data: [], isLocked: true });
    }

    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'username name avatar isPrivate');
      
    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const comment = {
      user: req.user.id,
      text: req.body.text
    };

    post.comments.push(comment);
    await post.save();

    await createNotification({
      user: post.user,
      sender: req.user.id,
      type: 'comment',
      post: post._id
    });

    const populatedPost = await Post.findById(post._id).populate('comments.user', 'username name avatar isPrivate');
    
    res.status(201).json({ success: true, data: populatedPost.comments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.user', 'username name avatar isPrivate');
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    res.status(200).json({ success: true, count: post.comments.length, data: post.comments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, count: 0, data: [] });
    
    const posts = await Post.find({
      $or: [
        { text: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username name avatar isPrivate');
    
    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this post' });
    }
    
    await post.deleteOne();
    await logActivity(req.user.id, req.user.username, 'delete_post', `Deleted post: "${post.text.slice(0, 50)}${post.text.length > 50 ? '...' : ''}"`, req.ip);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username name avatar isPrivate')
      .populate('comments.user', 'username name avatar isPrivate');
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const savedPosts = await Post.find({ saves: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user', 'username name avatar isPrivate');
    res.status(200).json({ success: true, count: savedPosts.length, data: savedPosts });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getLikedPosts = async (req, res) => {
  try {
    const likedPosts = await Post.find({ likes: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user', 'username name avatar isPrivate');
    res.status(200).json({ success: true, count: likedPosts.length, data: likedPosts });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Upload image (base64)
// @route   POST /api/posts/upload
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Assign the base64 data to fileUrl directly to bypass local storage
    const fileUrl = base64;
    
    // Log activity
    await logActivity(req.user.id, req.user.username, 'upload_image', `Uploaded image directly to DB via base64`, req.ip);

    res.status(200).json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
