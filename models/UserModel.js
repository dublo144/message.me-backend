const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  channels: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Channel'
    }
  ],
  conversations: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Conversation'
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
