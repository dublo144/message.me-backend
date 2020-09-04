const {
  gql,
  AuthenticationError,
  UserInputError
} = require('apollo-server-express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../../../models/UserModel');
const { transformUser } = require('../../helpers/merge');

const typeDefs = gql`
  type User {
    _id: ID!
    firstName: String!
    lastName: String!
    username: String!
    email: String!
    password: String
    channels: [Channel!]!
    conversations: [Conversation!]!
  }

  input UserInput {
    firstName: String!
    lastName: String!
    username: String!
    email: String!
    password: String!
  }

  type AuthData {
    username: String!
    userId: ID!
    token: String!
    tokenExpiration: Int!
  }

  extend type Query {
    users(email: String): [User!]!
    userData(userId: String): User!
    signIn(email: String!, password: String!): AuthData!
  }

  extend type Mutation {
    signUp(UserInput: UserInput!): User!
  }
`;

const resolvers = {
  Query: {
    users: async (_, { email }, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');
        const users = await UserModel.find({
          email: { $regex: email || '', $options: 'i' }
        });
        return users.map(transformUser);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    userData: async (_, __, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const userData = await UserModel.findById(user.userId);
        if (!userData) throw new UserInputError('User does not exist');

        return transformUser(userData);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    signIn: async (_, args) => {
      const { email, password } = args;

      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }
      const authenticated = await bcrypt.compare(password, user.password);
      if (!authenticated) {
        throw new Error('Invalid credentials');
      }
      const token = jwt.sign(
        {
          firstName: user.firstName,
          lastName: user.lastName,
          userId: user.id,
          username: user.username,
          email: user.email
        },
        process.env.SECRET
      );
      return {
        username: user.username,
        userId: user.id,
        token,
        tokenExpiration: 1
      };
    }
  },
  Mutation: {
    signUp: async (_, args) => {
      try {
        const existingUser = await UserModel.findOne({
          email: args.UserInput.email
        });
        if (existingUser) {
          throw new Error('User already exists');
        }

        const hashedPW = await bcrypt.hash(args.UserInput.password, 12);
        const user = new UserModel({
          firstName: args.UserInput.firstName,
          lastName: args.UserInput.lastName,
          username: args.UserInput.username,
          email: args.UserInput.email,
          password: hashedPW
        });

        const savedUser = await user.save();
        return { ...savedUser._doc, password: null, id: savedUser.id };
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  },
  Subscription: {}
};

module.exports = {
  typeDefs,
  resolvers
};
