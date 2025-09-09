
import * as Firebird from 'node-firebird';
import { config } from '../config';
import { QueryResult, ExecuteResult } from '../types';

type FirebirdPool = Firebird.ConnectionPool;
type FirebirdConnection = Firebird.Database;

class FirebirdConnectionManager {
  private pool: FirebirdPool | null = null;
  private isConnected = false;

  constructor() {
    this.initializePool();
  }

  private initializePool(): void {
    try {
      this.pool = Firebird.pool(config.pool.max, config.firebird);
      this.isConnected = true;
      console.log('Firebird connection pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebird connection pool:', error);
      this.isConnected = false;
    }
  }

  public getConnection(): Promise<FirebirdConnection> {
    return new Promise((resolve, reject) => {
      if (!this.pool || !this.isConnected) {
        reject(new Error('Database connection pool is not initialized'));
        return;
      }

      this.pool.get((err, db) => {
        if (err) {
          reject(new Error(`Failed to get database connection: ${err.message}`));
          return;
        }
        resolve(db);
      });
    });
  }

  public async executeQuery(sql: string, params: any[] = []): Promise<QueryResult> {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;
      let finished = false;

      // Set up timeout
      const timeoutMs = config.firebird.queryTimeout || 10000;
      timeoutId = setTimeout(() => {
        if (!finished) {
          finished = true;
          db.detach();
          reject(new Error(`Query timed out after ${timeoutMs} ms`));
        }
      }, timeoutMs);

      db.query(sql, params, (err, result) => {
        if (finished) return;
        finished = true;
        if (timeoutId) clearTimeout(timeoutId);
        db.detach();
        if (err) {
          reject(new Error(`Query execution failed: ${err.message}`));
          return;
        }
        resolve({
          rows: result || [],
          meta: [],
          count: Array.isArray(result) ? result.length : 0,
        });
      });
    });
  }

  public async executeCommand(sql: string, params: any[] = []): Promise<ExecuteResult> {
    const db = await this.getConnection();
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;
      let finished = false;

      // Set up timeout
      const timeoutMs = config.firebird.queryTimeout || 10000;
      timeoutId = setTimeout(() => {
        if (!finished) {
          finished = true;
          db.detach();
          reject(new Error(`Command timed out after ${timeoutMs} ms`));
        }
      }, timeoutMs);

      db.execute(sql, params, (err, result) => {
        if (finished) return;
        finished = true;
        if (timeoutId) clearTimeout(timeoutId);
        db.detach();
        if (err) {
          reject(new Error(`Command execution failed: ${err.message}`));
          return;
        }
        resolve({
          affectedRows: Array.isArray(result) ? result.length : 0,
          recordId: Array.isArray(result) && result.length === 0 ? result[0] : undefined,
          meta: [],
        });
      });
    });
  }

  public async executeTransaction<T>(
    operations: Array<{ sql: string; params?: any[] }>,
    isolation: string = 'READ_COMMITTED'
  ): Promise<T[]> {
    const db = await this.getConnection();
    // node-firebird требует явно передавать уровень изоляции
    const isolationLevel = Firebird.ISOLATION_READ_COMMITTED;
    return new Promise((resolve, reject) => {
      db.transaction(isolationLevel, (err, transaction) => {
        if (err) {
          reject(new Error(`Failed to start transaction: ${err.message}`));
          return;
        }
        this.executeTransactionOperations(transaction, operations, resolve, reject);
      });
    });
  }

  private executeTransactionOperations<T>(
    transaction: any,
    operations: Array<{ sql: string; params?: any[] }>,
    resolve: (value: T[]) => void,
    reject: (reason?: any) => void
  ): void {
    const results: T[] = [];
    let operationIndex = 0;

    const executeNext = () => {
      if (operationIndex >= operations.length) {
        this.commitTransaction(transaction, results, resolve, reject);
        return;
      }

      const operation = operations[operationIndex];
      if (operation) {
        this.executeTransactionOperation(transaction, operation, results, executeNext, reject);
      }
      operationIndex++;
    };

    executeNext();
  }

  private commitTransaction<T>(
    transaction: any,
    results: T[],
    resolve: (value: T[]) => void,
    reject: (reason?: any) => void
  ): void {
    transaction.commit((err: any) => {
      if (err) {
        reject(new Error(`Transaction commit failed: ${err.message}`));
        return;
      }
      resolve(results);
    });
  }

  private executeTransactionOperation<T>(
    transaction: any,
    operation: { sql: string; params?: any[] },
    results: T[],
    executeNext: () => void,
    reject: (reason?: any) => void
  ): void {
    transaction.query(operation.sql, operation.params || [], (err: any, result: any) => {
      if (err) {
        transaction.rollback(() => {
          reject(new Error(`Transaction operation failed: ${err.message}`));
        });
        return;
      }
      results.push(result as T);
      executeNext();
    });
  }

  public async getDatabaseInfo(): Promise<any> {
    const sql = `
      SELECT 
        RDB$GET_CONTEXT('SYSTEM', 'ENGINE_VERSION') as version,
        MON$PAGE_SIZE as page_size,
        MON$PAGES as pages,
        MON$SWEEP_INTERVAL as sweep_interval,
        MON$FORCED_WRITES as forced_writes,
        MON$READ_ONLY as read_only,
        MON$SQL_DIALECT as sql_dialect,
        MON$CREATION_DATE as creation_date
      FROM MON$DATABASE
    `;
    
    const result = await this.executeQuery(sql);
    const row = result.rows[0] || {};

    const lowerCased = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.toLowerCase(), v])
    );
    return lowerCased;
  }

  public async getTables(): Promise<any[]> {
    const sql = `
      SELECT 
        RDB$RELATION_NAME as name,
        RDB$RELATION_TYPE as type,
        RDB$DESCRIPTION as description
      FROM RDB$RELATIONS 
      WHERE RDB$SYSTEM_FLAG = 0
      ORDER BY RDB$RELATION_NAME
    `;
    
    const result = await this.executeQuery(sql);
    return result.rows.map(row => ({
      name: row.NAME?.trim(),
      type: row.TYPE === 0 ? 'TABLE' : 'VIEW',
      description: row.DESCRIPTION?.trim(),
    }));
  }

  public async getTableColumns(tableName: string): Promise<any[]> {
    const sql = `
      SELECT 
        RF.RDB$FIELD_NAME as name,
        F.RDB$FIELD_TYPE as type,
        F.RDB$FIELD_LENGTH as length,
        F.RDB$FIELD_PRECISION as precision,
        F.RDB$FIELD_SCALE as scale,
        RF.RDB$NULL_FLAG as nullable,
        RF.RDB$DEFAULT_VALUE as default_value
      FROM RDB$RELATION_FIELDS RF
      JOIN RDB$FIELDS F ON RF.RDB$FIELD_SOURCE = F.RDB$FIELD_NAME
      WHERE RF.RDB$RELATION_NAME = ?
      ORDER BY RF.RDB$FIELD_POSITION
    `;
    
    const result = await this.executeQuery(sql, [tableName.toUpperCase()]);
    return result.rows.map(row => ({
      name: row.NAME?.trim(),
      type: this.getFieldTypeName(row.TYPE),
      length: row.LENGTH,
      precision: row.PRECISION,
      scale: row.SCALE,
      nullable: !row.NULLABLE,
      default: row.DEFAULT_VALUE,
    }));
  }

  private getFieldTypeName(type: number): string {
    const typeMap: { [key: number]: string } = {
      7: 'SMALLINT',
      8: 'INTEGER',
      9: 'QUAD',
      10: 'FLOAT',
      11: 'D_FLOAT',
      12: 'DATE',
      13: 'TIME',
      14: 'CHAR',
      16: 'INT64',
      27: 'DOUBLE',
      35: 'TIMESTAMP',
      37: 'VARCHAR',
      40: 'CSTRING',
      261: 'BLOB',
    };
    return typeMap[type] || 'UNKNOWN';
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.executeQuery('SELECT 1 FROM RDB$DATABASE');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  public destroy(): void {
    if (this.pool) {
      this.pool.destroy();
      this.pool = null;
      this.isConnected = false;
      console.log('Firebird connection pool destroyed');
    }
  }
}

export const firebirdConnection = new FirebirdConnectionManager();
export default firebirdConnection;
