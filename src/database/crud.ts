import { firebirdConnection } from './connection';
import { QueryResult, ExecuteResult, PaginationParams } from '../types';

export class CrudService {
  /**
   * Выполняет SELECT запрос с поддержкой пагинации
   */
  public async select(
    tableName: string,
    columns: string[] = ['*'],
    whereClause?: string,
    params: any[] = [],
    pagination?: PaginationParams
  ): Promise<QueryResult> {
    let sql = `SELECT ${columns.join(', ')} FROM ${tableName}`;
    
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }

    if (pagination) {
      const limit = pagination.limit || 100;
      const offset = pagination.offset || (pagination.page ? (pagination.page - 1) * limit : 0);
      sql += ` ROWS ${offset + 1} TO ${offset + limit}`;
    }

    return await firebirdConnection.executeQuery(sql, params);
  }

  /**
   * Выполняет SELECT запрос по ID
   */
  public async selectById(
    tableName: string,
    id: any,
    idColumn: string = 'ID'
  ): Promise<QueryResult> {
    const sql = `SELECT * FROM ${tableName} WHERE ${idColumn} = ?`;
    return await firebirdConnection.executeQuery(sql, [id]);
  }

  /**
   * Выполняет INSERT операцию
   */
  public async insert(
    tableName: string,
    data: Record<string, any>
  ): Promise<ExecuteResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    return await firebirdConnection.executeCommand(sql, values);
  }

  /**
   * Выполняет INSERT операцию с возвратом ID
   */
  public async insertAndReturnId(
    tableName: string,
    data: Record<string, any>,
    idColumn: string = 'ID'
  ): Promise<{ result: ExecuteResult; id: any }> {
    const result = await this.insert(tableName, data);
    
    // Получаем последний вставленный ID
    const idResult = await firebirdConnection.executeQuery(
      `SELECT GEN_ID(${tableName}_${idColumn}_GEN, 0) as LAST_ID FROM RDB$DATABASE`
    );
    
    return {
      result,
      id: idResult.rows[0]?.LAST_ID
    };
  }

  /**
   * Выполняет UPDATE операцию
   */
  public async update(
    tableName: string,
    data: Record<string, any>,
    whereClause: string,
    params: any[] = []
  ): Promise<ExecuteResult> {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(data), ...params];
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    
    return await firebirdConnection.executeCommand(sql, values);
  }

  /**
   * Выполняет UPDATE операцию по ID
   */
  public async updateById(
    tableName: string,
    id: any,
    data: Record<string, any>,
    idColumn: string = 'ID'
  ): Promise<ExecuteResult> {
    return await this.update(tableName, data, `${idColumn} = ?`, [id]);
  }

  /**
   * Выполняет DELETE операцию
   */
  public async delete(
    tableName: string,
    whereClause: string,
    params: any[] = []
  ): Promise<ExecuteResult> {
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    return await firebirdConnection.executeCommand(sql, params);
  }

  /**
   * Выполняет DELETE операцию по ID
   */
  public async deleteById(
    tableName: string,
    id: any,
    idColumn: string = 'ID'
  ): Promise<ExecuteResult> {
    return await this.delete(tableName, `${idColumn} = ?`, [id]);
  }

  /**
   * Выполняет COUNT запрос
   */
  public async count(
    tableName: string,
    whereClause?: string,
    params: any[] = []
  ): Promise<number> {
    let sql = `SELECT COUNT(*) FROM ${tableName}`;
    
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }

    const result = await firebirdConnection.executeQuery(sql, params);
    return result.rows[0]?.COUNT || 0;
  }

  /**
   * Выполняет EXISTS запрос
   */
  public async exists(
    tableName: string,
    whereClause: string,
    params: any[] = []
  ): Promise<boolean> {
    const sql = `SELECT 1 FROM ${tableName} WHERE ${whereClause} ROWS 1`;
    const result = await firebirdConnection.executeQuery(sql, params);
    return result.count > 0;
  }

  /**
   * Выполняет EXISTS запрос по ID
   */
  public async existsById(
    tableName: string,
    id: any,
    idColumn: string = 'ID'
  ): Promise<boolean> {
    return await this.exists(tableName, `${idColumn} = ?`, [id]);
  }

  /**
   * Выполняет произвольный SQL запрос
   */
  public async executeQuery(sql: string, params: any[] = []): Promise<QueryResult> {
    return await firebirdConnection.executeQuery(sql, params);
  }

  /**
   * Выполняет произвольную SQL команду
   */
  public async executeCommand(sql: string, params: any[] = []): Promise<ExecuteResult> {
    return await firebirdConnection.executeCommand(sql, params);
  }

  /**
   * Выполняет пакет операций в транзакции
   */
  public async executeTransaction<T>(
    operations: Array<{ sql: string; params?: any[] }>
  ): Promise<T[]> {
    return await firebirdConnection.executeTransaction<T>(operations);
  }

  /**
   * Получает схему таблицы
   */
  public async getTableSchema(tableName: string): Promise<any> {
    const [tableInfo, columns] = await Promise.all([
      firebirdConnection.getTables().then(tables => 
        tables.find(table => table.name === tableName.toUpperCase())
      ),
      firebirdConnection.getTableColumns(tableName)
    ]);

    return {
      table: tableInfo,
      columns,
    };
  }

  /**
   * Получает список всех таблиц
   */
  public async getTables(): Promise<any[]> {
    return await firebirdConnection.getTables();
  }

  /**
   * Получает информацию о базе данных
   */
  public async getDatabaseInfo(): Promise<any> {
    return await firebirdConnection.getDatabaseInfo();
  }
}

export const crudService = new CrudService();
export default crudService;

