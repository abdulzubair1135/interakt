const express = require('express');
const { 
  getPosts, createPost, deletePost, likePost, savePost, getUserPosts, 
  getPost, searchPosts, getSavedPosts, getLikedPosts, uploadImage
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getPosts)
  .post(protect, createPost);

router.post('/upload', protect, uploadImage);

router.get('/search', searchPosts);
router.get('/saved', protect, getSavedPosts);
router.get('/liked', protect, getLikedPosts);

router.route('/user/:userId')
  .get(getUserPosts);

router.route('/:id')
  .get(getPost)
  .delete(protect, deletePost);

router.route('/:id/like')
  .put(protect, likePost);

router.route('/:id/save')
  .put(protect, savePost);

module.exports = router;
