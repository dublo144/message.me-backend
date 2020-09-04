const {
  gql,
  AuthenticationError,
  UserInputError
} = require('apollo-server-express');
const UserModel = require('../../../models/UserModel');
const MessageModel = require('../../../models/MessageModel');
const ChannelModel = require('../../../models/ChannelModel');
const ConversationModel = require('../../../models/ConversationModel');
const { transformMessage } = require('../../helpers/merge');
const server = require('../../../server');

const typeDefs = gql`
  type Message {
    id: ID!
    user: User!
    content: String!
    date: String!
    likes: Int
    dislikes: Int
  }

  extend type Mutation {
    newMessage(channelId: ID!, content: String!): Message!
    newConversationMessage(conversationId: ID!, content: String!): Message!
  }

  extend type Subscription {
    message(channelId: ID!): Message!
  }
`;

const resolvers = {
  Query: {},
  Mutation: {
    newMessage: async (_, { channelId, content }, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const message = new MessageModel({
          user: user.userId,
          content: content,
          date: new Date(),
          likes: 0,
          dislikes: 0
        });

        const savedMessage = await message.save();

        const channel = await ChannelModel.findById(channelId);
        if (!channel) throw new Error('Channel does not exist');

        channel.messages.push(savedMessage);
        await channel.save();

        server.pubsub.publish(channelId, {
          message: transformMessage(savedMessage)
        });

        return transformMessage(savedMessage);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    newConversationMessage: async (
      _,
      { conversationId, content },
      { user }
    ) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const savedUser = await UserModel.findById(user.userId);
        if (!savedUser) throw new UserInputError('User not found');

        const conversation = ConversationModel.findById(conversationId);
        if (!conversation) throw new UserInputError('Conversation not found');

        if (content.trim() === '') throw new UserInputError('Message empty');

        const message = new MessageModel({
          user: savedUser,
          date: new Date(),
          content,
          likes: 0,
          dislikes: 0
        });

        const savedMessage = await message.save();

        conversation.messages.push(savedMessage);
        await conversation.save();

        return transformMessage(savedMessage);
      } catch (error) {
        console.log(error);
        throw error;
      }
    }
  },
  Subscription: {
    message: {
      subscribe: (_, { channelId }) => {
        return server.pubsub.asyncIterator([channelId]);
      }
    }
  }
};

module.exports = {
  typeDefs,
  resolvers
};
