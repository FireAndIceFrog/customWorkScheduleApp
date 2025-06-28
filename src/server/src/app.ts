import express from 'express';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

export async function createApp() {
  const app = express();

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
  });

  return app;
}

export async function createApolloServer() {
  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  return server;
}
