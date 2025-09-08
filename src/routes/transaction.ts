import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { crudService } from '../database/crud';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, validationSchemas, validateSqlQuery } from '../middleware/validation';
import { ApiResponse } from '../types';

const router = Router();

/**
 * POST /api/transaction/execute
 * Выполняет пакет операций в транзакции
 */
router.post('/execute',
  validateRequest(validationSchemas.transaction),
  asyncHandler(async (req: Request, res: Response) => {
    const { operations, isolation } = req.body;

    // Валидация всех SQL запросов на безопасность
    for (const operation of operations) {
      validateSqlQuery(operation.sql);
    }

    try {
      const results = await crudService.executeTransaction(operations);

      const response: ApiResponse = {
        success: true,
        data: {
          results,
          operationsCount: operations.length,
          isolation: isolation || 'READ_COMMITTED',
        },
        message: `Transaction completed successfully. ${operations.length} operations executed.`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.json(response);
    } catch (error) {
      // Транзакция автоматически откатывается при ошибке
      throw createError(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  })
);

/**
 * POST /api/transaction/batch-insert
 * Выполняет пакетную вставку записей в транзакции
 */
router.post('/batch-insert',
  validateRequest({
    body: Joi.object({
      table: Joi.string().required().min(1).max(50),
      records: Joi.array().items(
        Joi.object().pattern(
          Joi.string().min(1).max(50),
          Joi.any()
        )
      ).min(1).max(1000).required(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table, records } = req.body;

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

    // Подготавливаем операции для транзакции
    const operations = records.map((record: Record<string, any>) => {
      const columns = Object.keys(record);
      const values = Object.values(record);
      const placeholders = columns.map(() => '?').join(', ');
      
      return {
        sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        params: values,
      };
    });

    try {
      const results = await crudService.executeTransaction(operations);

      const response: ApiResponse = {
        success: true,
        data: {
          insertedCount: records.length,
          results,
        },
        message: `Batch insert completed successfully. ${records.length} records inserted.`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.json(response);
    } catch (error) {
      throw createError(`Batch insert failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  })
);

/**
 * POST /api/transaction/batch-update
 * Выполняет пакетное обновление записей в транзакции
 */
router.post('/batch-update',
  validateRequest({
    body: Joi.object({
      table: Joi.string().required().min(1).max(50),
      updates: Joi.array().items(
        Joi.object({
          id: Joi.alternatives().try(
            Joi.string(),
            Joi.number().integer()
          ).required(),
          data: Joi.object().pattern(
            Joi.string().min(1).max(50),
            Joi.any()
          ).min(1).required(),
        })
      ).min(1).max(1000).required(),
      idColumn: Joi.string().default('ID'),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table, updates, idColumn } = req.body;

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

    // Подготавливаем операции для транзакции
    const operations = updates.map((update: { id: any; data: Record<string, any> }) => {
      const setClause = Object.keys(update.data)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = [...Object.values(update.data), update.id];
      
      return {
        sql: `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`,
        params: values,
      };
    });

    try {
      const results = await crudService.executeTransaction(operations);

      const response: ApiResponse = {
        success: true,
        data: {
          updatedCount: updates.length,
          results,
        },
        message: `Batch update completed successfully. ${updates.length} records updated.`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.json(response);
    } catch (error) {
      throw createError(`Batch update failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  })
);

/**
 * POST /api/transaction/batch-delete
 * Выполняет пакетное удаление записей в транзакции
 */
router.post('/batch-delete',
  validateRequest({
    body: Joi.object({
      table: Joi.string().required().min(1).max(50),
      ids: Joi.array().items(
        Joi.alternatives().try(
          Joi.string(),
          Joi.number().integer()
        )
      ).min(1).max(1000).required(),
      idColumn: Joi.string().default('ID'),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table, ids, idColumn } = req.body;

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

    // Подготавливаем операции для транзакции
    const operations = ids.map((id: any) => ({
      sql: `DELETE FROM ${table} WHERE ${idColumn} = ?`,
      params: [id],
    }));

    try {
      const results = await crudService.executeTransaction(operations);

      const response: ApiResponse = {
        success: true,
        data: {
          deletedCount: ids.length,
          results,
        },
        message: `Batch delete completed successfully. ${ids.length} records deleted.`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.json(response);
    } catch (error) {
      throw createError(`Batch delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  })
);

export default router;
