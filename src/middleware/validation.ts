import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Валидация body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Валидация query параметров
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Валидация params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      throw createError(`Validation error: ${errors.join('; ')}`, 400);
    }

    next();
  };
};

// Схемы валидации для различных операций
export const validationSchemas = {
  // Схема для выполнения произвольного SQL запроса
  executeQuery: {
    body: Joi.object({
      sql: Joi.string().required().min(1).max(10000),
      params: Joi.array().items(Joi.any()).optional(),
      pagination: Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(1000).optional(),
        offset: Joi.number().integer().min(0).optional(),
      }).optional(),
    }),
  },

  // Схема для CRUD операций
  crudOperation: {
    params: Joi.object({
      table: Joi.string().required().min(1).max(50),
    }),
  },

  // Схема для операций с ID
  idOperation: {
    params: Joi.object({
      table: Joi.string().required().min(1).max(50),
      id: Joi.alternatives().try(
        Joi.string(),
        Joi.number().integer()
      ).required(),
    }),
  },

  // Схема для создания записи
  createRecord: {
    params: Joi.object({
      table: Joi.string().required().min(1).max(50),
    }),
    body: Joi.object().pattern(
      Joi.string().min(1).max(50),
      Joi.any()
    ).min(1).required(),
  },

  // Схема для обновления записи
  updateRecord: {
    params: Joi.object({
      table: Joi.string().required().min(1).max(50),
      id: Joi.alternatives().try(
        Joi.string(),
        Joi.number().integer()
      ).required(),
    }),
    body: Joi.object().pattern(
      Joi.string().min(1).max(50),
      Joi.any()
    ).min(1).required(),
  },

  // Схема для пагинации
  pagination: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(1000).optional(),
      offset: Joi.number().integer().min(0).optional(),
    }),
  },

  // Схема для поиска
  search: {
    query: Joi.object({
      q: Joi.string().min(1).max(100).optional(),
      columns: Joi.string().optional(),
      where: Joi.string().optional(),
    }),
  },

  // Схема для транзакций
  transaction: {
    body: Joi.object({
      operations: Joi.array().items(
        Joi.object({
          sql: Joi.string().required().min(1).max(10000),
          params: Joi.array().items(Joi.any()).optional(),
        })
      ).min(1).max(100).required(),
      isolation: Joi.string().valid(
        'READ_COMMITTED',
        'SNAPSHOT',
        'SNAPSHOT_TABLE_STABILITY'
      ).optional(),
    }),
  },
};

// Валидация SQL запроса на безопасность
export const validateSqlQuery = (sql: string): void => {
  const dangerousPatterns = [
    /DROP\s+(TABLE|DATABASE|INDEX|PROCEDURE|FUNCTION|TRIGGER)/i,
    /ALTER\s+(TABLE|DATABASE)/i,
    /CREATE\s+(TABLE|DATABASE|INDEX|PROCEDURE|FUNCTION|TRIGGER)/i,
    /GRANT\s+/i,
    /REVOKE\s+/i,
    /EXECUTE\s+AS\s+/i,
    /--/,
    /\/\*/,
    /;\s*$/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      throw createError('Potentially dangerous SQL operation detected', 400);
    }
  }

  // Проверка на минимальную длину и наличие SELECT/INSERT/UPDATE/DELETE
  const allowedOperations = /^(SELECT|INSERT|UPDATE|DELETE|EXECUTE|CALL)\s+/i;
  if (!allowedOperations.test(sql.trim())) {
    throw createError('Only SELECT, INSERT, UPDATE, DELETE, EXECUTE, and CALL operations are allowed', 400);
  }
};

