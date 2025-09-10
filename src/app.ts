import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { 
  securityHeaders, 
  rateLimiter, 
  requestId, 
  requestLogger, 
  databaseHealthCheck,
  validateContentType,
  bodySizeLimit 
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import queryRoutes from './routes/query';
import crudRoutes from './routes/crud';
import transactionRoutes from './routes/transaction';
import asyncRoutes from './routes/async';

const app: express.Application = express();

// Security middleware
app.use(securityHeaders);
app.use(rateLimiter);

// CORS configuration
app.use(cors(config.cors));

// Request processing middleware
app.use(requestId);
app.use(requestLogger);
app.use(validateContentType);
app.use(bodySizeLimit);

// Logging middleware
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { firebirdConnection } = await import('./database/connection');
    const isConnected = await firebirdConnection.testConnection();
    
    res.json({
      success: true,
      status: isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        host: config.firebird.host,
        port: config.firebird.port,
        database: config.firebird.database,
      },
      requestId: req.headers['x-request-id'],
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }
});

// API routes
app.use('/api/query', databaseHealthCheck, queryRoutes);
app.use('/api/crud', databaseHealthCheck, crudRoutes);
app.use('/api/transaction', databaseHealthCheck, transactionRoutes);
app.use('/api', databaseHealthCheck, asyncRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Node Firebridge API Server',
    version: '1.0.0',
    description: 'A production-ready REST API server for Firebird databases',
    endpoints: {
      health: '/health',
      query: '/api/query',
      crud: '/api/crud',
      transaction: '/api/transaction',
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

export default app;
