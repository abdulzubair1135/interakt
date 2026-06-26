const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  avatar: { type: String, default: '' },
  admin: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
