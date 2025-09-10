import { firebirdConnection } from './connection';
import { QueryResult, ExecuteResult, PaginationParams } from '../types';

export class CrudService {
  /**
   * Executes a SELECT query with pagination support
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
   * Executes a SELECT query by ID
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
   * Executes an INSERT operation
   */
  public async insert(
    tableName: string,
    data: Record<string, any>,
    idColumn: string = 'ID'
  ): Promise<ExecuteResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ${idColumn ? `RETURNING ${idColumn}` : ''}`;
    return await firebirdConnection.executeCommand(sql, values);
  }

  /**
   * Executes an INSERT operation and returns the ID
   */
  public async insertAndReturnId(
    tableName: string,
    data: Record<string, any>
  ): Promise<{ result: ExecuteResult; id: any }> {
    const idColumn = await this.getPrimaryKey(tableName);
    const result = await this.insert(tableName, data, idColumn);
    
    return {
      result,
      id: result.recordId
    };
  }

  /**
   * Executes an UPDATE operation
   */
  public async update(
    tableName: string,
    data: Record<string, any>,
    whereClause: string,
    params: any[] = [],
    idColumn: string = 'ID'
  ): Promise<ExecuteResult> {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(data), ...params];
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause} ${idColumn ? `RETURNING ${idColumn}` : ''}`;
    
    return await firebirdConnection.executeCommand(sql, values);
  }

  /**
   * Executes an UPDATE operation by ID
   */
  public async updateById(
    tableName: string,
    id: any,
    data: Record<string, any>
  ): Promise<ExecuteResult> {
    const idColumn = (await this.getPrimaryKey(tableName));

    return await this.update(tableName, data, `${idColumn} = ?`, [id], idColumn);
  }

  /**
   * Executes a DELETE operation
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
   * Executes a DELETE operation by ID
   */
  public async deleteById(
    tableName: string,
    id: any,
    idColumn: string = 'ID'
  ): Promise<ExecuteResult> {
    return await this.delete(tableName, `${idColumn} = ?`, [id]);
  }

  /**
   * Executes a COUNT query
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
   * Executes an EXISTS query
   */
  public async getPrimaryKey(
    tableName: string,
    params: any[] = []
  ): Promise<string> {
    const sql = `
      SELECT 
          sg.RDB$FIELD_NAME AS PRIMARY_KEY_FIELD
      FROM 
          RDB$RELATION_CONSTRAINTS rc
      JOIN 
          RDB$INDEX_SEGMENTS sg ON rc.RDB$INDEX_NAME = sg.RDB$INDEX_NAME
      WHERE 
          rc.RDB$CONSTRAINT_TYPE = 'PRIMARY KEY'
          AND rc.RDB$RELATION_NAME = UPPER('${tableName}')
      ROWS 1`;
    const result = await firebirdConnection.executeQuery(sql, params);
    return result.rows[0]?.PRIMARY_KEY_FIELD?.trim() || '';
  }

  /**
   * Executes an EXISTS query
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
   * Executes an EXISTS query by ID
   */
  public async existsById(
    tableName: string,
    id: any,
  ): Promise<boolean> {
    const idColumn = await this.getPrimaryKey(tableName);
    return await this.exists(tableName, `${idColumn} = ?`, [id]);
  }

  /**
   * Executes an arbitrary SQL query
   */
  public async executeQuery(sql: string, params: any[] = [], timeout?: number): Promise<QueryResult> {
    return await firebirdConnection.executeQuery(sql, params, timeout);
  }

  /**
   * Executes an arbitrary SQL command
   */
  public async executeCommand(sql: string, params: any[] = []): Promise<ExecuteResult> {
    return await firebirdConnection.executeCommand(sql, params);
  }

  /**
   * Executes a batch of operations in a transaction
   */
  public async executeTransaction<T>(
    operations: Array<{ sql: string; params?: any[] }>
  ): Promise<T[]> {
    return await firebirdConnection.executeTransaction<T>(operations);
  }

  /**
   * Gets the schema of a table
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
   * Gets a list of all tables
   */
  public async getTables(): Promise<any[]> {
    return await firebirdConnection.getTables();
  }

  /**
   * Gets database information
   */
  public async getDatabaseInfo(): Promise<any> {
    return await firebirdConnection.getDatabaseInfo();
  }
}

export const crudService = new CrudService();
export default crudService;

