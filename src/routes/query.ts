import { Router, Request, Response } from 'express';
import { crudService } from '../database/crud';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, validationSchemas, validateSqlQuery } from '../middleware/validation';
import { ApiResponse, PaginatedResponse } from '../types';

const router: Router = Router();

/**
 * POST /api/query/execute
 * Executes an arbitrary SQL query
 */
router.post('/execute', 
  validateRequest(validationSchemas.executeQuery),
  asyncHandler(async (req: Request, res: Response) => {
    const { sql, params = [], pagination } = req.body;

    // Validate SQL query for security
    validateSqlQuery(sql);

    let result;
    if (pagination) {
      // For SELECT queries with pagination
      const limit = pagination.limit || 100;
      const offset = pagination.offset || (pagination.page ? (pagination.page - 1) * limit : 0);
      
      // Add pagination to SQL query
      const paginatedSql = `${sql} ROWS ${offset + 1} TO ${offset + limit}`;
      result = await crudService.executeQuery(paginatedSql, params);

      // Get total record count for pagination
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
      // Regular query execution
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
 * Executes an SQL command (INSERT, UPDATE, DELETE, EXECUTE)
 */
router.post('/command',
  validateRequest({
    body: validationSchemas.executeQuery.body,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { sql, params = [] } = req.body;

    // Validate SQL query for security
    validateSqlQuery(sql);

    const result = await crudService.executeCommand(sql, params);

    const response: ApiResponse = {
      success: true,
      data: {
        affectedRows: result.affectedRows,
        recordId: result.recordId,
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
 * Gets a list of all tables in the database
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
 * Gets the schema of a table
 */
router.get('/tables/:table/schema',
  validateRequest({
    params: validationSchemas.crudOperation.params,
  }),
  asyncHandler(async (req: Request, res: Response) => {

    const { table } = req.params;
    if (!table) {
      throw createError('Table parameter is required', 400);
    }
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
 * Gets database information
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

