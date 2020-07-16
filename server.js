var express = require('express');
var { PubSub }  = require('graphql-subscriptions');
var { createServer }  = require('http');
const { ApolloServer } = require('apollo-server-express');
const http = require('http');

var comments = [
    {id:'1', value:'first'},
]
 
const pubsub = new PubSub();
const COMMENT_ADDED_TOPIC = 'newComment';

// Construct a schema, using GraphQL schema language
const typeDefs = `
  type Comment{
      id:ID!,
      value : String!
  }
  type Query {
    comments: [Comment]
    comment(id: ID!): Comment
  }
  type Mutation {
      addComment(value: String! ): Comment
  }
  type Subscription {
      commentAdded: Comment,
  }
`;
let nextId = 2;

// The root provides a resolver function for each API endpoint
const resolvers = {
    Query:{
  comments: () => {
      return comments;
  },
},
    Mutation:{
      addComment: async (_,args, context) => {
      const comment = {id: String(nextId++), value: args.value};
      comments.push(comment);
      await pubsub.publish(COMMENT_ADDED_TOPIC, {commentAdded : comment});
      return comment
  },
},
    Subscription:{
    commentAdded:{ 
      subscribe : async () => await pubsub.asyncIterator(COMMENT_ADDED_TOPIC)
  }
},
};

PORT = 4001;
var app = express();

const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({app});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

// ⚠️ Pay attention to the fact that we are calling `listen` on the http server variable, and not on `app`.
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)
})


