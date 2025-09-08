export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QueryRequest {
  sql: string;
  params?: any[];
  pagination?: PaginationParams;
}

export interface TableInfo {
  name: string;
  type: 'TABLE' | 'VIEW' | 'PROCEDURE' | 'FUNCTION' | 'TRIGGER';
  description?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  length?: number;
  precision?: number;
  scale?: number;
}

export interface TableSchema {
  table: TableInfo;
  columns: ColumnInfo[];
  indexes?: any[];
  constraints?: any[];
}

export interface DatabaseInfo {
  version: string;
  ods_version: string;
  page_size: number;
  pages: number;
  sweep_interval: number;
  forced_writes: boolean;
  read_only: boolean;
  sql_dialect: number;
  creation_date: string;
}

export interface ConnectionInfo {
  connected: boolean;
  database: string;
  user: string;
  role?: string;
  charset: string;
  client_version: string;
  server_version: string;
}

