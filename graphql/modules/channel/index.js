const { gql, AuthenticationError } = require('apollo-server-express');
const { transformChannel } = require('../../helpers/merge');
const UserModel = require('../../../models/UserModel');
const ChannelModel = require('../../../models/ChannelModel');

const typeDefs = gql`
  type Channel {
    id: ID!
    name: String!
    description: String
    admins: [User!]!
    members: [User!]!
    messages: [Message!]!
    isAdmin: Boolean
  }

  input ChannelInput {
    name: String!
    description: String
    members: [String!]
  }

  extend type Query {
    channels: [Channel!]!
    channelDetails(channelId: String!): Channel!
  }

  extend type Mutation {
    createChannel(ChannelInput: ChannelInput!): Channel!
    deleteChannel(channelId: ID!): Channel!
    subscribeToChannel(channelId: String!): Channel!
  }
`;

const resolvers = {
  Query: {
    channels: async (_, __, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');
        const channels = await ChannelModel.find({ members: user.userId });
        return channels.map(transformChannel);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    channelDetails: async (_, { channelId }, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const channel = await ChannelModel.findById(channelId);
        if (!channel) throw new Error('Channel does not exist');

        if (channel.members.filter((member) => member.id === user.userId) === 0)
          throw new Error('User is not a member of the channel');

        return transformChannel(channel);
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  },
  Mutation: {
    subscribeToChannel: async (_, { channelId }, { user }) => {
      try {
        if (!context.user) throw new AuthenticationError('Unauthenticated');

        const channel = await ChannelModel.findById(channelId);
        if (!channel) throw new Error('Channel does not exist');

        const savedUser = UserModel.findById(user.userId);

        if (channel.members.find((user) => savedUser.id === user.userId)) {
          throw new Error('User already subscribed to the channel');
        }
        channel.members.push(savedUser);
        const savedChannel = await channel.save();
        return transformChannel(savedChannel);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    createChannel: async (_, args, { user }) => {
      try {
        // Are we authenticated?
        if (!user) throw new AuthenticationError('Unauthenticated');

        // Find the memberId from their email
        const userIds = await UserModel.find({
          email: { $in: args.ChannelInput.members }
        }).distinct('_id', (err, results) => results);

        // Create Channel Mongoose Model
        const channel = new ChannelModel({
          name: args.ChannelInput.name,
          description: args.ChannelInput.description,
          admins: [user.userId],
          members: [...userIds, user.userId]
        });
        const savedChannel = await channel.save();

        // Find the members
        const users = await UserModel.find({
          _id: { $in: [...userIds, user.userId] }
        });
        // Add the channel to the members
        users.map(async (user) => {
          user.channels.push(savedChannel);
          await user.save();
        });

        const isAdmin = savedChannel.admins.includes(user.userId);

        // Return the channel
        return transformChannel(savedChannel, isAdmin);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    deleteChannel: async (_, { channelId }, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const channel = await ChannelModel.findById(channelId);

        if (!channel.admins.includes(user.userId))
          throw new AuthenticationError(
            'User is not an admin of the given channel'
          );

        await channel.remove();

        return transformChannel(channel);
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  }
};

module.exports = {
  typeDefs,
  resolvers
};
