const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  nickname: { type: String, default: '' },
  emoji: { type: String, default: '🎓' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isPremium: { type: Boolean, default: false },
  premiumUntil: { type: String, default: null },
  collegeId: { type: String, default: '' },
  phone: { type: String, default: '' },
  isPrivate: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  lastLogin: { type: Date, default: Date.now },
  followers: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for masked name
UserSchema.virtual('displayName').get(function() {
  if (this.isPrivate) {
    const maskedId = this._id.toString().slice(-3);
    return `User_${maskedId}`;
  }
  return this.name || this.username;
});

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
