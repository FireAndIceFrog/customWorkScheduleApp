import { startStandaloneServer } from '@apollo/server/standalone';
import { createApp, createApolloServer } from './app';
import config from './config';

async function startServer() {
  try {
    // Create and start Apollo GraphQL server
    const apolloServer = await createApolloServer();
    
    const { url } = await startStandaloneServer(apolloServer, {
      listen: { port: config.port },
    });

    console.log(`🚀 GraphQL Server ready at: ${url}`);
    console.log(`📊 GraphQL Playground available at: ${url}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`💾 Database: ${config.databasePath}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await apolloServer.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();
