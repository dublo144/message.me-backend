const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageModel = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  likes: Number,
  dislikes: Number
});

module.exports = mongoose.model('Message', messageModel);
