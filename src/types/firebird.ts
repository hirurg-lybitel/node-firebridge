export interface FirebirdConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  role?: string;
  pageSize?: number;
  lowercase_keys?: boolean;
}

export interface FirebirdConnection {
  query: (sql: string, params?: any[], callback?: (err: any, result: any) => void) => void;
  execute: (sql: string, params?: any[], callback?: (err: any, result: any) => void) => void;
  transaction: (callback: (transaction: FirebirdTransaction) => void) => void;
  detach: () => void;
  commit: (callback?: (err: any) => void) => void;
  rollback: (callback?: (err: any) => void) => void;
}

export interface FirebirdTransaction {
  query: (sql: string, params?: any[], callback?: (err: any, result: any) => void) => void;
  execute: (sql: string, params?: any[], callback?: (err: any, result: any) => void) => void;
  commit: (callback?: (err: any) => void) => void;
  rollback: (callback?: (err: any) => void) => void;
}

export interface FirebirdPool {
  get: (callback: (err: any, db: FirebirdConnection) => void) => void;
  destroy: () => void;
}

export interface QueryResult {
  rows: any[];
  meta: any[];
  count: number;
}

export interface ExecuteResult {
  affectedRows: number;
  insertId?: number | undefined;
  meta: any[];
}

export interface DatabaseOperation {
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'EXECUTE';
  table?: string;
  sql: string;
  params?: any[];
}

export interface TransactionOperation {
  operations: DatabaseOperation[];
  isolation?: 'READ_COMMITTED' | 'SNAPSHOT' | 'SNAPSHOT_TABLE_STABILITY';
  wait?: 'NO_WAIT' | 'WAIT';
  lock_resolution?: 'NO_WAIT' | 'WAIT';
  read_only?: boolean;
}

