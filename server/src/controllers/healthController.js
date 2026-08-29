import mongoose from 'mongoose';
import { config } from '../config/env.js';

export const getHealthStatus = (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    success: true,
    message: 'AI-Assisted Smart Task & Workflow Hub Server is running.',
    environment: config.nodeEnv,
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    dbStatus,
  });
};
