const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
    maxlength: [1000, 'Post cannot be more than 1000 characters']
  },
  postType: {
    type: String,
    enum: ['regular', 'notes', 'confession'],
    default: 'regular'
  },
  category: {
    type: String,
    enum: ['general', 'memes', 'questions', 'events', 'clubs', 'study', 'funny', 'confession', 'exam'],
    default: 'general'
  },
  tags: [{
    type: String
  }],
  media: {
    type: String, // URL to image or file
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  saves: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 27 * 60 * 60 * 1000) // 27 hours from now
  }
}, {
  timestamps: true
});

// TTL index to automatically delete posts after 27 hours
postSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Post', postSchema);
