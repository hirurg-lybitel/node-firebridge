
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';


// Ограничение количества запросов (например, 100 запросов за 15 минут с одного IP)
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  standardHeaders: true, // Возвращать информацию в заголовках RateLimit-*
  legacyHeaders: false, // Отключить заголовки X-RateLimit-*
  message: (req: Request) => ({
    success: false,
    error: 'Too many requests, please try again later.',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
  }),
});

// Настройка helmet для безопасности
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

// Middleware для добавления request ID
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Middleware для логирования запросов
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  // Логирование входящего запроса
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
  });

  // Перехват ответа для логирования
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

// Middleware для проверки подключения к базе данных
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

// Middleware для валидации Content-Type
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

// Middleware для ограничения размера тела запроса
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
