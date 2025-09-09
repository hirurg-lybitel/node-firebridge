
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';


// Rate limiting (e.g., 100 requests per 15 minutes per IP)
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // maximum 100 requests
  standardHeaders: true, // Return info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: (req: Request) => ({
    success: false,
    error: 'Too many requests, please try again later.',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
  }),
});

// Helmet configuration for security
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Middleware to add request ID
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Middleware for request logging
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
  });

  // Intercept response for logging
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode}`, {
      requestId,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
    });

    return originalSend.call(this, data);
  };

  next();
};

// Middleware to check database connection
export const databaseHealthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firebirdConnection } = await import('../database/connection');
    const isConnected = await firebirdConnection.testConnection();
    
    if (!isConnected) {
      res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(503).json({
      success: false,
      error: 'Database health check failed',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }
};

// Middleware to validate Content-Type
export const validateContentType = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    if (!contentType?.includes('application/json')) {
      res.status(400).json({
        success: false,
        error: 'Content-Type must be application/json',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
      return;
    }
  }
  next();
};

// Middleware to limit request body size
export const bodySizeLimit = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.get('Content-Length') || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    res.status(413).json({
      success: false,
      error: 'Request entity too large',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
    return;
  }

  next();
};
