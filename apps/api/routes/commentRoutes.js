const express = require('express');
const { addComment, getPostComments } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/:postId')
  .get(getPostComments)
  .post(protect, addComment);

module.exports = router;
