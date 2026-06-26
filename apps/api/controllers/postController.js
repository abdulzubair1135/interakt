const JSONStore = require('../utils/jsonStore');
const { createNotification } = require('../utils/notifications');
const { logActivity } = require('../utils/activityLogger');

const postStore = new JSONStore('posts');
const userStore = new JSONStore('users');

const populateUser = async (data, field = 'user') => {
  const users = await userStore.read();
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      [field]: users.find(u => u._id === item[field]) || { username: 'Deleted User', avatar: '' }
    }));
  }
  return { ...data, [field]: users.find(u => u._id === data[field]) };
};

exports.getPosts = async (req, res) => {
  try {
    let posts = await postStore.read();
    if (req.query.tag) posts = posts.filter(p => (p.tags || []).includes(req.query.tag));
    if (req.query.category) posts = posts.filter(p => p.category === req.query.category);

    // Privacy Filter
    const currentUserId = req.user ? req.user.id : null;
    const currentUser = currentUserId ? await userStore.findById(currentUserId) : null;
    const allUsers = await userStore.read();
    const publicUserIds = allUsers.filter(u => !u.isPrivate).map(u => u._id);
    const followingIds = currentUser ? (currentUser.following || []) : [];
    const allowedIds = [...publicUserIds, ...followingIds, currentUserId];

    posts = posts.filter(p => allowedIds.includes(p.user));
    posts = await populateUser(posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      user: req.user.id,
      likes: [],
      saves: [],
      comments: [],
      expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    const post = await postStore.create(postData);
    const populated = await populateUser(post);
    await logActivity(req.user.id, req.user.username, 'create_post', `Created post: "${post.text.slice(0, 50)}${post.text.length > 50 ? '...' : ''}"`, req.ip);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await postStore.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const userId = req.user.id;
    const isLiked = (post.likes || []).includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes = [...(post.likes || []), userId];
    }

    await postStore.findByIdAndUpdate(post._id, { likes: post.likes });

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
    const post = await postStore.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const userId = req.user.id;
    const isSaved = (post.saves || []).includes(userId);

    if (isSaved) {
      post.saves = post.saves.filter(id => id !== userId);
    } else {
      post.saves = [...(post.saves || []), userId];
    }

    await postStore.findByIdAndUpdate(post._id, { saves: post.saves });
    res.status(200).json({ success: true, saved: !isSaved, data: post.saves });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const user = await userStore.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const currentUserId = req.user ? req.user.id : null;
    const isFollowing = (user.followers || []).includes(currentUserId);
    const isOwner = currentUserId === req.params.userId;

    if (user.isPrivate && !isFollowing && !isOwner) {
      return res.status(200).json({ success: true, count: 0, data: [], isLocked: true });
    }

    let posts = await postStore.find({ user: req.params.userId });
    posts = await populateUser(posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const post = await postStore.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const comment = {
      _id: Date.now().toString(),
      user: req.user.id,
      text: req.body.text,
      createdAt: new Date().toISOString()
    };

    const comments = [...(post.comments || []), comment];
    await postStore.findByIdAndUpdate(post._id, { comments });

    await createNotification({
      user: post.user,
      sender: req.user.id,
      type: 'comment',
      post: post._id
    });

    const allUsers = await userStore.read();
    const populatedComments = comments.map(c => ({
      ...c,
      user: allUsers.find(u => u._id === c.user)
    }));
    
    res.status(201).json({ success: true, data: populatedComments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const post = await postStore.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    const allUsers = await userStore.read();
    const populatedComments = (post.comments || []).map(c => ({
      ...c,
      user: allUsers.find(u => u._id === c.user)
    }));
    res.status(200).json({ success: true, count: populatedComments.length, data: populatedComments });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, count: 0, data: [] });
    
    let posts = await postStore.read();
    posts = posts.filter(p => p.text.toLowerCase().includes(q.toLowerCase()) || (p.tags || []).some(t => t.toLowerCase().includes(q.toLowerCase())));
    posts = await populateUser(posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await postStore.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    
    if (post.user !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this post' });
    }
    
    await postStore.findByIdAndDelete(req.params.id);
    await logActivity(req.user.id, req.user.username, 'delete_post', `Deleted post: "${post.text.slice(0, 50)}${post.text.length > 50 ? '...' : ''}"`, req.ip);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await postStore.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    const populated = await populateUser(post);
    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const allPosts = await postStore.read();
    let saved = allPosts.filter(p => (p.saves || []).includes(req.user.id));
    saved = await populateUser(saved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    res.status(200).json({ success: true, count: saved.length, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getLikedPosts = async (req, res) => {
  try {
    const allPosts = await postStore.read();
    let liked = allPosts.filter(p => (p.likes || []).includes(req.user.id));
    liked = await populateUser(liked.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    res.status(200).json({ success: true, count: liked.length, data: liked });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const fs = require('fs');
const path = require('path');

// @desc    Upload image (base64)
// @route   POST /api/posts/upload
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Extract base64 content
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/png';
    let base64Data = base64;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    // Determine extension
    let ext = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('webp')) ext = 'webp';

    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
    const uploadsDir = path.join(__dirname, '../public/uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

    const fileUrl = `http://localhost:5005/uploads/${filename}`;
    
    // Log activity
    await logActivity(req.user.id, req.user.username, 'upload_image', `Uploaded image: ${filename}`, req.ip);

    res.status(200).json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
