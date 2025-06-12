const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  image: { type: String, required: true },
});

module.exports = mongoose.model('Post', postSchema);