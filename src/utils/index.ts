/**
 * Генерирует уникальный ID для запроса
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Форматирует ошибку для ответа API
 */
export const formatError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Unknown error occurred';
};

/**
 * Проверяет, является ли строка валидным SQL идентификатором
 */
export const isValidSqlIdentifier = (identifier: string): boolean => {
  const sqlIdentifierRegex = /^[a-zA-Z_]\w*$/;
  return sqlIdentifierRegex.test(identifier);
};

/**
 * Экранирует SQL идентификатор
 */
export const escapeSqlIdentifier = (identifier: string): string => {
  if (!isValidSqlIdentifier(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
};

/**
 * Создает WHERE условие для поиска
 */
export const createSearchCondition = (
  searchTerm: string,
  columns: string[],
  operator: 'LIKE' | 'CONTAINS' = 'LIKE'
): string => {
  if (operator === 'CONTAINS') {
    return `CONTAINS(${columns.join(' || ')} || '', '${searchTerm}')`;
  }
  
  const conditions = columns.map(column => 
    `${column} LIKE '%${searchTerm}%'`
  );
  
  return conditions.join(' OR ');
};

/**
 * Создает ORDER BY условие
 */
export const createOrderBy = (
  sortBy?: string,
  sortOrder: 'ASC' | 'DESC' = 'ASC'
): string => {
  if (!sortBy) {
    return '';
  }
  
  if (!isValidSqlIdentifier(sortBy)) {
    throw new Error(`Invalid sort column: ${sortBy}`);
  }
  
  return `ORDER BY ${sortBy} ${sortOrder}`;
};

/**
 * Создает LIMIT и OFFSET для пагинации
 */
export const createPagination = (
  page?: number,
  limit?: number,
  offset?: number
): string => {
  if (!limit) {
    return '';
  }
  
  const actualOffset = offset || (page ? (page - 1) * limit : 0);
  return `ROWS ${actualOffset + 1} TO ${actualOffset + limit}`;
};

/**
 * Валидирует и нормализует параметры пагинации
 */
export const normalizePagination = (
  page?: number,
  limit?: number,
  offset?: number
): { limit: number; offset: number; page: number } => {
  const normalizedLimit = Math.min(limit || 100, 1000);
  const normalizedPage = Math.max(page || 1, 1);
  const normalizedOffset = offset || (normalizedPage - 1) * normalizedLimit;
  
  return {
    limit: normalizedLimit,
    offset: normalizedOffset,
    page: normalizedPage,
  };
};

/**
 * Создает SQL для подсчета общего количества записей
 */
export const createCountQuery = (
  baseQuery: string,
  whereClause?: string
): string => {
  let countQuery = baseQuery;
  
  if (whereClause) {
    countQuery += ` WHERE ${whereClause}`;
  }
  
  return `SELECT COUNT(*) as total FROM (${countQuery}) as count_query`;
};

/**
 * Преобразует результат Firebird в стандартный формат
 */
export const normalizeFirebirdResult = (result: any): any => {
  if (!result || !Array.isArray(result)) {
    return result;
  }
  
  return result.map(row => {
    const normalizedRow: any = {};
    
    for (const [key, value] of Object.entries(row)) {
      // Убираем пробелы из ключей (Firebird часто добавляет их)
      const cleanKey = key.trim();
      normalizedRow[cleanKey] = value;
    }
    
    return normalizedRow;
  });
};

/**
 * Логирует SQL запрос (только в development режиме)
 */
export const logSqlQuery = (sql: string, params?: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('SQL Query:', sql);
    if (params && params.length > 0) {
      console.log('Parameters:', params);
    }
  }
};
