import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { ActivityLog } from '../src/models/ActivityLog';
import { AiReport } from '../src/models/AiReport';
import { Client } from '../src/models/Client';
import { FinancialInsight } from '../src/models/FinancialInsight';
import { ServiceEfficiency } from '../src/models/ServiceEfficiency';
import { User } from '../src/models/User';
import { logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

interface SeedData {
  users: any[];
  clients: any[];
  financialInsights: any[];
  serviceEfficiency: any[];
  aiReports: any[];
  activityLogs: any[];
}

const loadSeedData = (): SeedData => {
  const dataDir = path.join(__dirname, 'data');
  
  const loadJsonFile = (filename: string): any[] => {
    const filePath = path.join(dataDir, filename);
    
    if (!fs.existsSync(filePath)) {
      logger.warn(`Seed file not found: ${filename}`);
      return [];
    }
    
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error loading seed file ${filename}:`, error);
      return [];
    }
  };

  return {
    users: loadJsonFile('users.json'),
    clients: loadJsonFile('clients.json'),
    financialInsights: loadJsonFile('financialInsights.json'),
    serviceEfficiency: loadJsonFile('serviceEfficiency.json'),
    aiReports: loadJsonFile('aiReports.json'),
    activityLogs: loadJsonFile('activityLogs.json')
  };
};

const convertObjectId = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(convertObjectId);
  }
  
  if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === '_id' && value && typeof value === 'object' && '$oid' in value) {
        converted[key] = new mongoose.Types.ObjectId((value as any).$oid);
      } else if (key === 'userId' || key === 'clientId' || key === 'technicianId' || key === 'generatedForId') {
        if (value && typeof value === 'object' && '$oid' in value) {
          converted[key] = new mongoose.Types.ObjectId((value as any).$oid);
        } else {
          converted[key] = value;
        }
      } else if (key === 'createdAt' || key === 'lastLogin' || key === 'timestamp') {
        if (value && typeof value === 'object' && '$date' in value) {
          converted[key] = new Date((value as any).$date);
        } else {
          converted[key] = value;
        }
      } else {
        converted[key] = convertObjectId(value);
      }
    }
    return converted;
  }
  
  return data;
};

const seedDatabase = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(mongoURI);
    logger.info('Connected to MongoDB');

    // Load seed data
    const seedData = loadSeedData();
    logger.info('Loaded seed data files');

    // Clear existing data (optional - comment out if you want to keep existing data)
    logger.info('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Client.deleteMany({}),
      FinancialInsight.deleteMany({}),
      ServiceEfficiency.deleteMany({}),
      AiReport.deleteMany({}),
      ActivityLog.deleteMany({})
    ]);
    logger.info('Existing data cleared');

    // Convert ObjectIds and dates
    const convertedData = {
      users: convertObjectId(seedData.users),
      clients: convertObjectId(seedData.clients),
      financialInsights: convertObjectId(seedData.financialInsights),
      serviceEfficiency: convertObjectId(seedData.serviceEfficiency),
      aiReports: convertObjectId(seedData.aiReports),
      activityLogs: convertObjectId(seedData.activityLogs)
    };

    // Insert data in order (respecting dependencies)
    logger.info('Seeding users...');
    if (convertedData.users.length > 0) {
      await User.insertMany(convertedData.users);
      logger.info(`Inserted ${convertedData.users.length} users`);
    }

    logger.info('Seeding clients...');
    if (convertedData.clients.length > 0) {
      await Client.insertMany(convertedData.clients);
      logger.info(`Inserted ${convertedData.clients.length} clients`);
    }

    logger.info('Seeding financial insights...');
    if (convertedData.financialInsights.length > 0) {
      await FinancialInsight.insertMany(convertedData.financialInsights);
      logger.info(`Inserted ${convertedData.financialInsights.length} financial insights`);
    }

    logger.info('Seeding service efficiency records...');
    if (convertedData.serviceEfficiency.length > 0) {
      await ServiceEfficiency.insertMany(convertedData.serviceEfficiency);
      logger.info(`Inserted ${convertedData.serviceEfficiency.length} service efficiency records`);
    }

    logger.info('Seeding AI reports...');
    if (convertedData.aiReports.length > 0) {
      await AiReport.insertMany(convertedData.aiReports);
      logger.info(`Inserted ${convertedData.aiReports.length} AI reports`);
    }

    logger.info('Seeding activity logs...');
    if (convertedData.activityLogs.length > 0) {
      await ActivityLog.insertMany(convertedData.activityLogs);
      logger.info(`Inserted ${convertedData.activityLogs.length} activity logs`);
    }

    // Verify data was inserted
    const counts = await Promise.all([
      User.countDocuments(),
      Client.countDocuments(),
      FinancialInsight.countDocuments(),
      ServiceEfficiency.countDocuments(),
      AiReport.countDocuments(),
      ActivityLog.countDocuments()
    ]);

    logger.info('Database seeding completed successfully!');
    logger.info(`Final counts: Users: ${counts[0]}, Clients: ${counts[1]}, Financial Insights: ${counts[2]}, Service Efficiency: ${counts[3]}, AI Reports: ${counts[4]}, Activity Logs: ${counts[5]}`);

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Run seed script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;


