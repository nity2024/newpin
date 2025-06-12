const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  fullname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  profileImage: { type: String, default: 'default.png' },
  contact: { type: Number, sparse: true },
  bio: { type: String, default: '', trim: true },
  boards: { type: Array, default: [] },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { autoIndex: false });

userSchema.plugin(plm);

module.exports = mongoose.model('user', userSchema);