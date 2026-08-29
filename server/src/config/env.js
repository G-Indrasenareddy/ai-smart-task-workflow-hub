import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/flowmind_ai',
  jwtSecret: process.env.JWT_SECRET || 'flowmind_ai_super_secret_jwt_private_key_9988776655',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
