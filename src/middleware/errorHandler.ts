import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Обработка специфичных ошибок Firebird
  if (error.message.includes('connection')) {
    statusCode = 503;
    message = 'Database connection error';
  } else if (error.message.includes('syntax')) {
    statusCode = 400;
    message = 'SQL syntax error';
  } else if (error.message.includes('permission') || error.message.includes('access')) {
    statusCode = 403;
    message = 'Access denied';
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (error.message.includes('foreign key')) {
    statusCode = 400;
    message = 'Foreign key constraint violation';
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string,
  };

  // Логирование ошибки
  console.error(`[${new Date().toISOString()}] Error ${statusCode}: ${message}`, {
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string,
  };

  res.status(404).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

