import dotenv from 'dotenv';
import { FirebirdConfig } from '../types';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  firebird: {
    host: process.env.FIREBIRD_HOST || 'localhost',
    port: parseInt(process.env.FIREBIRD_PORT || '3050', 10),
    database: process.env.FIREBIRD_DATABASE || '',
    user: process.env.FIREBIRD_USER || 'SYSDBA',
    password: process.env.FIREBIRD_PASSWORD || 'masterkey',
    role: process.env.FIREBIRD_ROLE || undefined,
    pageSize: parseInt(process.env.FIREBIRD_PAGE_SIZE || '4096', 10),
    lowercase_keys: process.env.FIREBIRD_LOWER_CASE_KEYS === 'true',
  } as FirebirdConfig,
  pool: {
    min: parseInt(process.env.POOL_MIN || '2', 10),
    max: parseInt(process.env.POOL_MAX || '10', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },
};

export default config;

