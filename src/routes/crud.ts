import { Router, Request, Response } from 'express';
import { crudService } from '../database/crud';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, validationSchemas } from '../middleware/validation';
import { ApiResponse, PaginatedResponse } from '../types';

const router: Router = Router();

/**
 * GET /api/crud/:table
 * Получает все записи из таблицы с поддержкой пагинации и фильтрации
 */
router.get('/:table',
  validateRequest({
    params: validationSchemas.crudOperation.params,
    query: validationSchemas.pagination.query,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table } = req.params;
    if (!table) {
      throw createError('Table parameter is required', 400);
    }
    const { page, limit, offset, columns, where, q } = req.query;

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

    const selectColumns = columns ? (columns as string).split(',') : ['*'];
    const searchTerm = q && typeof q === 'string' ? q : '';
    const whereClause = where || (searchTerm ? `CONTAINS(${selectColumns.join(' || ')} || '', '${searchTerm}')` : undefined);
    
    const pagination = {
      page: page ? parseInt(page as string, 10) : 0,
      limit: limit ? parseInt(limit as string, 10) : 0,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    const result = await crudService.select(
      table,
      selectColumns,
      typeof whereClause === 'string' ? whereClause : undefined,
      [],
      pagination
    );

    if (pagination.page || pagination.limit) {
      // Получаем общее количество записей для пагинации
      const total = await crudService.count(
        table,
        typeof whereClause === 'string' ? whereClause : undefined
      );
      const limitValue = pagination.limit || 100;
      const pageValue = pagination.page || 1;

      const response: PaginatedResponse<any> = {
        success: true,
        data: result.rows,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
        pagination: {
          page: pageValue,
          limit: limitValue,
          total,
          totalPages: Math.ceil(total / limitValue),
          hasNext: pageValue * limitValue < total,
          hasPrev: pageValue > 1,
        },
      };

      res.json(response);
    } else {
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
 * GET /api/crud/:table/:id
 * Получает запись по ID
 */
router.get('/:table/:id',
  validateRequest({
    params: validationSchemas.idOperation.params,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table, id } = req.params;
    if (!table) {
      throw createError('Table parameter is required', 400);
    }
    if (!id) {
      throw createError('ID parameter is required', 400);
    }

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

  const result = await crudService.selectById(table, id);

    if (result.count === 0) {
      throw createError(`Record with ID '${id}' not found in table '${table}'`, 404);
    }

    const response: ApiResponse = {
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.json(response);
  })
);

/**
 * POST /api/crud/:table
 * Создает новую запись в таблице
 */
router.post('/:table',
  validateRequest({
    params: validationSchemas.crudOperation.params,
    body: validationSchemas.createRecord.body,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table } = req.params;
    if (!table) {
      throw createError('Table parameter is required', 400);
    }
    const data = req.body;

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

  const result = await crudService.insertAndReturnId(table, data);

    const response: ApiResponse = {
      success: true,
      data: {
        id: result.id,
        affectedRows: result.result.affectedRows,
      },
      message: 'Record created successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.status(201).json(response);
  })
);

/**
 * PUT /api/crud/:table/:id
 * Обновляет запись по ID
 */
router.put('/:table/:id',
  validateRequest({
    params: validationSchemas.idOperation.params,
    body: validationSchemas.updateRecord.body,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table, id } = req.params;
    if (!table) {
      throw createError('Table parameter is required', 400);
    }
    if (!id) {
      throw createError('ID parameter is required', 400);
    }
    const data = req.body;

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

    // Проверяем существование записи
  const recordExists = await crudService.existsById(table, id);
    if (!recordExists) {
      throw createError(`Record with ID '${id}' not found in table '${table}'`, 404);
    }

  const result = await crudService.updateById(table, id, data);

    const response: ApiResponse = {
      success: true,
      data: {
        affectedRows: result.affectedRows,
      },
      message: 'Record updated successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.json(response);
  })
);

/**
 * DELETE /api/crud/:table/:id
 * Удаляет запись по ID
 */
router.delete('/:table/:id',
  validateRequest({
    params: validationSchemas.idOperation.params,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table, id } = req.params;
    if (!table) {
      throw createError('Table parameter is required', 400);
    }
    if (!id) {
      throw createError('ID parameter is required', 400);
    }

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

    // Проверяем существование записи
  const recordExists = await crudService.existsById(table, id);
    if (!recordExists) {
      throw createError(`Record with ID '${id}' not found in table '${table}'`, 404);
    }

  const result = await crudService.deleteById(table, id);

    const response: ApiResponse = {
      success: true,
      data: {
        affectedRows: result.affectedRows,
      },
      message: 'Record deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.json(response);
  })
);

/**
 * GET /api/crud/:table/count
 * Получает количество записей в таблице
 */
router.get('/:table/count',
  validateRequest({
    params: validationSchemas.crudOperation.params,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { table } = req.params;
    if (!table) {
      throw createError('Table parameter is required', 400);
    }
    const { where } = req.query;

    // Проверяем существование таблицы
    const exists = await crudService.getTables().then(tables => 
      tables.some(t => t.name === table.toUpperCase())
    );

    if (!exists) {
      throw createError(`Table '${table}' not found`, 404);
    }

  const count = await crudService.count(table, where as string);

    const response: ApiResponse = {
      success: true,
      data: { count },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.json(response);
  })
);

export default router;

