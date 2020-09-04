const ChannelModel = require('../../models/ChannelModel');
const UserModel = require('../../models/UserModel');

const ConversationModel = require('../../models/ConversationModel');
const MessageModel = require('../../models/MessageModel');

const channel = async (channelId) => {
  try {
    const channel = await ChannelModel.findById(channelId);
    return transformChannel(channel);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const channels = async (channelIds) => {
  try {
    const channels = await ChannelModel.find({ _id: { $in: channelIds } });
    return channels.map(transformChannel);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const messages = async (messageIds) => {
  try {
    const messages = await MessageModel.find({
      _id: { $in: messageIds }
    });
    return messages.map(transformMessage);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const user = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    return transformUser(user);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const users = async (userIds) => {
  try {
    const users = await UserModel.find({ _id: { $in: userIds } });
    return users.map(transformUser);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const conversations = async (conversationIds) => {
  try {
    const conversations = await ConversationModel.find({
      _id: { $in: conversationIds }
    });
    return conversations.map(transformConversation);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const transformUser = (user) => {
  return {
    ...user._doc,
    id: user.id,
    password: null,
    channels: channels.bind(this, user.channels),
    conversations: conversations.bind(this, user.conversations)
  };
};

const transformMessage = (message) => {
  return {
    ...message._doc,
    id: message.id,
    user: user.bind(this, message.user)
  };
};

const transformChannel = (channel) => {
  return {
    ...channel._doc,
    id: channel.id,
    admins: users.bind(this, channel.admins),
    members: users.bind(this, channel.members),
    messages: messages.bind(this, channel.messages)
  };
};

const transformConversation = (conversation) => {
  return {
    ...conversation._doc,
    id: conversation.id,
    members: users.bind(this, conversation.members),
    messages: messages.bind(this, conversation.messages)
  };
};

module.exports = {
  transformUser,
  transformChannel,
  transformConversation,
  transformMessage
};
