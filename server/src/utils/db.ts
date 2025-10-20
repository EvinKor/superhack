import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI as string;
    if (!uri) throw new Error('MONGODB_URI missing');
    
    const conn = await mongoose.connect(uri, { dbName: 'aiopsDB' });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

export default connectDB;
