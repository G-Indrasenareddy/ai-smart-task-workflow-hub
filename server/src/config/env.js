import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'flowmind_ai_super_secret_jwt_private_key_9988776655',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
};

export const validateEnv = () => {
  const missing = [];
  if (!config.mongoUri) missing.push('MONGODB_URI');
  if (!config.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing environment variables: ${missing.join(', ')}`);
  }

  const isGeminiConfigured =
    config.geminiApiKey &&
    config.geminiApiKey.trim() !== '' &&
    config.geminiApiKey !== 'your_gemini_api_key_here';

  if (isGeminiConfigured) {
    console.log(`Gemini configuration: configured (Model: ${config.geminiModel})`);
  } else {
    console.log('Gemini configuration: not configured');
  }

  if (config.nodeEnv === 'production' && config.jwtSecret.includes('super_secret_jwt')) {
    console.warn('[Config Security Warning] Production mode detected with default JWT secret. Use a strong random key in server/.env.');
  }
};
