const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const conversationMessageSchema = new Schema({
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
  }
});

module.exports = mongoose.model(
  'ConversationMessage',
  conversationMessageSchema
);
