// 
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // in case login added later
  sessionId: { type: String, required: true }, // 🔑 uniquely identifies each session
  title: { type: String, default: 'Untitled Component' }, // 🏷️ optional title
  prompt: String,
  jsx: String,
  css: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
