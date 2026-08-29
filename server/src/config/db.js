import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './env.js';

// Configure DNS fallback for MongoDB Atlas SRV lookup on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore DNS override errors if restricted by system policy
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`=================================`);
    console.log(` MongoDB Atlas Connected`);
    console.log(` Host:     ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
    console.log(`=================================`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`);
    throw error;
  }
};
