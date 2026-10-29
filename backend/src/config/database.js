import mongoose from 'mongoose';
import { config } from './index.js';
import logger from '../utils/logger.js';

let mongodInstance = null;

async function connectDB() {
  // First attempt: Connect to configured MongoDB URI
  try {
    logger.info(`Attempting MongoDB connection at ${config.mongodb.uri}...`);
    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected successfully to primary database');
    return;
  } catch (err) {
    logger.warn(`Primary MongoDB connection to ${config.mongodb.uri} failed: ${err.message}`);
  }

  // Second attempt: In-memory MongoDB for zero-configuration local development
  if (config.env !== 'production') {
    try {
      logger.info('Starting local in-memory MongoDB server for development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      logger.info(`Connecting to in-memory MongoDB at ${inMemoryUri}`);
      
      await mongoose.connect(inMemoryUri, {
        maxPoolSize: 10,
      });
      logger.info('In-memory MongoDB connected successfully! Complete LMS database is ready.');
      return;
    } catch (memErr) {
      logger.error('Failed to start in-memory MongoDB', { error: memErr.message });
    }
  }

  logger.error('Fatal: Could not connect to any MongoDB instance.');
  process.exit(1);
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — attempting reconnect');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error', { error: err.message });
});

export async function stopDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}

export { connectDB };
