const mongoose = require('mongoose');
const UserModel = require('./UserModel');
const MessageModel = require('./MessageModel');

const Schema = mongoose.Schema;

const channelSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  ]
});

channelSchema.post('remove', async (doc) => {
  await UserModel.updateMany(
    { _id: { $in: doc.members } },
    { $pull: { channels: doc.id } },
    {}
  );
  await MessageModel.deleteMany({ _id: { $in: doc.messages } });
});

module.exports = mongoose.model('Channel', channelSchema);
