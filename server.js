const express = require('express');
const {
  ApolloServer,
  AuthenticationError,
  PubSub
} = require('apollo-server-express');
const mongoose = require('mongoose');
const authMiddleware = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const http = require('http');

const server = new ApolloServer({
  modules: [
    require('./graphql/modules/user'),
    require('./graphql/modules/channel'),
    require('./graphql/modules/conversation'),
    require('./graphql/modules/message')
  ],
  subscriptions: {
    onConnect: (connectionParams) => {
      if (connectionParams.Authorization) {
        const token = connectionParams.Authorization.split('Bearer ')[1];
        return jwt.verify(token, process.env.SECRET, (err, decodedToken) => {
          if (err) throw new AuthenticationError('Invalid Token');
          return {
            user: decodedToken
          };
        });
      } else {
        throw new AuthenticationError('Not authenticated');
      }
    }
  },
  context: authMiddleware,
  engine: {
    reportSchema: true,
    variant: 'current'
  },
  tracing: true
});

const app = express();

server.applyMiddleware({
  app,
  cors: {
    origin: new RegExp('/*/'),
    credentials: true
  }
});

mongoose.set('debug', true);

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0-wabpp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
  )
  .then(() =>
    httpServer.listen({ port: process.env.PORT || 4000 }, () => {
      console.log(
        `🚀 Server ready at http://localhost:4000${server.graphqlPath}`
      );
      console.log(
        `🚀 SubscriptionServer ready at http://localhost:4000${server.subscriptionsPath}`
      );
    })
  )
  .catch((e) => console.log(e));

module.exports.pubsub = new PubSub();
