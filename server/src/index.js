import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`=================================`);
      console.log(` FlowMind AI Server Running`);
      console.log(` Port:        ${config.port}`);
      console.log(` Environment: ${config.nodeEnv}`);
      console.log(` Client URL:  ${config.clientUrl}`);
      console.log(` Health:      http://localhost:${config.port}/api/health`);
      console.log(`=================================`);
    });

    const handleShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('Server failed to start due to MongoDB connection failure.');
  }
};

startServer();
