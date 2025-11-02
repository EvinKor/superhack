import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler, notFound } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { testConnection } from './utils/supabase';

// Import routes
import activityLogRoutes from './routes/activityLogs';
import aiReportRoutes from './routes/aiReports';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import financialInsightRoutes from './routes/financialInsights';
import serviceEfficiencyRoutes from './routes/serviceEfficiency';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config(); // Loads from current directory or parent directories

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (fixes X-Forwarded-For header error)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    details: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/financial-insights', financialInsightRoutes);
app.use('/api/service-efficiency', serviceEfficiencyRoutes);
app.use('/api/ai-reports', aiReportRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Minimal web app manifest to satisfy browser requests from the SPA
app.get('/manifest.json', (req, res) => {
  res.json({
    name: 'MSP Platform',
    short_name: 'MSP',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3F4F6',
    theme_color: '#1E3A8A',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon'
      }
    ]
  });
});

// Suppress common browser/dev tool 404s
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'MSP Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      clients: '/api/clients',
      financialInsights: '/api/financial-insights',
      serviceEfficiency: '/api/service-efficiency',
      aiReports: '/api/ai-reports',
      activityLogs: '/api/activity-logs'
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test Supabase connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Supabase');
    }
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
