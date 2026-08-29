import mongoose from 'mongoose';
import app from './app.js';
import { config, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  try {
    validateEnv();
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

    const handleShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await mongoose.disconnect();
          console.log('MongoDB Atlas connection closed successfully.');
        } catch (err) {
          console.error('Error disconnecting MongoDB:', err.message);
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      console.error('[Unhandled Rejection]:', reason instanceof Error ? reason.message : reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('[Uncaught Exception]:', error.message);
    });
  } catch (error) {
    console.error('Server failed to start due to database connection failure:', error.message);
    process.exit(1);
  }
};

startServer();
