"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const ActivityLog_1 = require("../src/models/ActivityLog");
const AiReport_1 = require("../src/models/AiReport");
const Client_1 = require("../src/models/Client");
const FinancialInsight_1 = require("../src/models/FinancialInsight");
const ServiceEfficiency_1 = require("../src/models/ServiceEfficiency");
const User_1 = require("../src/models/User");
const logger_1 = require("../src/utils/logger");
dotenv_1.default.config();
const loadSeedData = () => {
    const dataDir = path_1.default.join(__dirname, 'data');
    const loadJsonFile = (filename) => {
        const filePath = path_1.default.join(dataDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.logger.warn(`Seed file not found: ${filename}`);
            return [];
        }
        try {
            const data = fs_1.default.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.error(`Error loading seed file ${filename}:`, error);
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
const convertObjectId = (data) => {
    if (Array.isArray(data)) {
        return data.map(convertObjectId);
    }
    if (data && typeof data === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === '_id' && value && typeof value === 'object' && '$oid' in value) {
                converted[key] = new mongoose_1.default.Types.ObjectId(value.$oid);
            }
            else if (key === 'userId' || key === 'clientId' || key === 'technicianId' || key === 'generatedForId') {
                if (value && typeof value === 'object' && '$oid' in value) {
                    converted[key] = new mongoose_1.default.Types.ObjectId(value.$oid);
                }
                else {
                    converted[key] = value;
                }
            }
            else if (key === 'createdAt' || key === 'lastLogin' || key === 'timestamp') {
                if (value && typeof value === 'object' && '$date' in value) {
                    converted[key] = new Date(value.$date);
                }
                else {
                    converted[key] = value;
                }
            }
            else {
                converted[key] = convertObjectId(value);
            }
        }
        return converted;
    }
    return data;
};
const seedDatabase = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        await mongoose_1.default.connect(mongoURI);
        logger_1.logger.info('Connected to MongoDB');
        const seedData = loadSeedData();
        logger_1.logger.info('Loaded seed data files');
        logger_1.logger.info('Clearing existing data...');
        await Promise.all([
            User_1.User.deleteMany({}),
            Client_1.Client.deleteMany({}),
            FinancialInsight_1.FinancialInsight.deleteMany({}),
            ServiceEfficiency_1.ServiceEfficiency.deleteMany({}),
            AiReport_1.AiReport.deleteMany({}),
            ActivityLog_1.ActivityLog.deleteMany({})
        ]);
        logger_1.logger.info('Existing data cleared');
        const convertedData = {
            users: convertObjectId(seedData.users),
            clients: convertObjectId(seedData.clients),
            financialInsights: convertObjectId(seedData.financialInsights),
            serviceEfficiency: convertObjectId(seedData.serviceEfficiency),
            aiReports: convertObjectId(seedData.aiReports),
            activityLogs: convertObjectId(seedData.activityLogs)
        };
        logger_1.logger.info('Seeding users...');
        if (convertedData.users.length > 0) {
            await User_1.User.insertMany(convertedData.users);
            logger_1.logger.info(`Inserted ${convertedData.users.length} users`);
        }
        logger_1.logger.info('Seeding clients...');
        if (convertedData.clients.length > 0) {
            await Client_1.Client.insertMany(convertedData.clients);
            logger_1.logger.info(`Inserted ${convertedData.clients.length} clients`);
        }
        logger_1.logger.info('Seeding financial insights...');
        if (convertedData.financialInsights.length > 0) {
            await FinancialInsight_1.FinancialInsight.insertMany(convertedData.financialInsights);
            logger_1.logger.info(`Inserted ${convertedData.financialInsights.length} financial insights`);
        }
        logger_1.logger.info('Seeding service efficiency records...');
        if (convertedData.serviceEfficiency.length > 0) {
            await ServiceEfficiency_1.ServiceEfficiency.insertMany(convertedData.serviceEfficiency);
            logger_1.logger.info(`Inserted ${convertedData.serviceEfficiency.length} service efficiency records`);
        }
        logger_1.logger.info('Seeding AI reports...');
        if (convertedData.aiReports.length > 0) {
            await AiReport_1.AiReport.insertMany(convertedData.aiReports);
            logger_1.logger.info(`Inserted ${convertedData.aiReports.length} AI reports`);
        }
        logger_1.logger.info('Seeding activity logs...');
        if (convertedData.activityLogs.length > 0) {
            await ActivityLog_1.ActivityLog.insertMany(convertedData.activityLogs);
            logger_1.logger.info(`Inserted ${convertedData.activityLogs.length} activity logs`);
        }
        const counts = await Promise.all([
            User_1.User.countDocuments(),
            Client_1.Client.countDocuments(),
            FinancialInsight_1.FinancialInsight.countDocuments(),
            ServiceEfficiency_1.ServiceEfficiency.countDocuments(),
            AiReport_1.AiReport.countDocuments(),
            ActivityLog_1.ActivityLog.countDocuments()
        ]);
        logger_1.logger.info('Database seeding completed successfully!');
        logger_1.logger.info(`Final counts: Users: ${counts[0]}, Clients: ${counts[1]}, Financial Insights: ${counts[2]}, Service Efficiency: ${counts[3]}, AI Reports: ${counts[4]}, Activity Logs: ${counts[5]}`);
    }
    catch (error) {
        logger_1.logger.error('Error seeding database:', error);
        throw error;
    }
    finally {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('Database connection closed');
    }
};
if (require.main === module) {
    seedDatabase()
        .then(() => {
        logger_1.logger.info('Seed script completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Seed script failed:', error);
        process.exit(1);
    });
}
exports.default = seedDatabase;
//# sourceMappingURL=seed.js.map