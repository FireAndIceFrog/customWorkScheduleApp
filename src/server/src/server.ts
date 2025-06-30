import { createApp } from './app';
import config from './config';

async function startServer() {
  try {
    // Create and start Apollo GraphQL server
    const express = await createApp();
    const server = express.listen(
      { port: config.port },
      (err) => console.log(err)
    )


    console.log(`🚀 GraphQL Server ready at: http://localhost:${config.port}`);
    console.log(`📊 GraphQL Playground available at: http://localhost:${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`💾 Database: ${config.databasePath}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      server.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();
