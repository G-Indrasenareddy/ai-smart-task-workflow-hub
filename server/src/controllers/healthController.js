import { config } from '../config/env.js';

export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FlowMind AI Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: `${Math.floor(process.uptime())}s`,
  });
};
