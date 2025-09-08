import { Router, Request, Response } from 'express';
import { crudService } from '../database/crud';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, validationSchemas, validateSqlQuery } from '../middleware/validation';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();

/**
 * POST /api/query/execute
 * Выполняет произвольный SQL запрос
 */
router.post('/execute', 
  validateRequest(validationSchemas.executeQuery),
  asyncHandler(async (req: Request, res: Response) => {
    const { sql, params = [], pagination } = req.body;

    // Валидация SQL запроса на безопасность
    validateSqlQuery(sql);

    let result;
    if (pagination) {
      // Для SELECT запросов с пагинацией
      const limit = pagination.limit || 100;
      const offset = pagination.offset || (pagination.page ? (pagination.page - 1) * limit : 0);
      
      // Добавляем пагинацию к SQL запросу
      const paginatedSql = `${sql} ROWS ${offset + 1} TO ${offset + limit}`;
      result = await crudService.executeQuery(paginatedSql, params);

      // Получаем общее количество записей для пагинации
      const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_query`;
      const countResult = await crudService.executeQuery(countSql, params);
      const total = countResult.rows[0]?.TOTAL || 0;

      const response: PaginatedResponse<any> = {
        success: true,
        data: result.rows,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
        pagination: {
          page: pagination.page || 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: (pagination.page || 1) * limit < total,
          hasPrev: (pagination.page || 1) > 1,
        },
      };

      res.json(response);
    } else {
      // Обычное выполнение запроса
      result = await crudService.executeQuery(sql, params);

      const response: ApiResponse = {
        success: true,
        data: result.rows,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.json(response);
    }
  })
);

/**
 * POST /api/query/command
 * Выполняет SQL команду (INSERT, UPDATE, DELETE, EXECUTE)
 */
router.post('/command',
  validateRequest({
    body: validationSchemas.executeQuery.body,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { sql, params = [] } = req.body;

    // Валидация SQL запроса на безопасность
    validateSqlQuery(sql);

    const result = await crudService.executeCommand(sql, params);

    const response: ApiResponse = {
      success: true,
      data: {
        affectedRows: result.affectedRows,
        insertId: result.insertId,
      },
      message: `Command executed successfully. ${result.affectedRows} rows affected.`,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.json(response);
  })
);

/**
 * GET /api/query/tables
 * Получает список всех таблиц в базе данных
 */
router.get('/tables',
  asyncHandler(async (req: Request, res: Response) => {
    const tables = await crudService.getTables();

    const response: ApiResponse = {
      success: true,
      data: tables,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.json(response);
  })
);

/**
 * GET /api/query/tables/:table/schema
 * Получает схему таблицы
 */
router.get('/tables/:table/schema',
  validateRequest({
    params: validationSchemas.crudOperation.params,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table } = req.params;
    const schema = await crudService.getTableSchema(table);

    if (!schema.table) {
      throw createError(`Table '${table}' not found`, 404);
    }

    const response: ApiResponse = {
      success: true,
      data: schema,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.json(response);
  })
);

/**
 * GET /api/query/database/info
 * Получает информацию о базе данных
 */
router.get('/database/info',
  asyncHandler(async (req: Request, res: Response) => {
    const info = await crudService.getDatabaseInfo();

    const response: ApiResponse = {
      success: true,
      data: info,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.json(response);
  })
);

export default router;

