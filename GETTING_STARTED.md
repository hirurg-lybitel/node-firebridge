
# Getting Started with Node Firebridge

This document will help you quickly launch the Node Firebridge API server.

## Quick Start

### 1. Install Dependencies

#### Using pnpm (recommended):

```bash
# Install pnpm (if not installed)
npm install -g pnpm

# Install dependencies
pnpm install
```

#### Using npm:

```bash
npm install
```

### 2. Configure the Database

Copy the configuration file:
```bash
cp env.example .env
```

Edit the `.env` file with your Firebird database settings:

```env
# Firebird Database Configuration
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/path/to/your/database.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey
FIREBIRD_ROLE=
FIREBIRD_PAGE_SIZE=4096
FIREBIRD_LOWER_CASE_KEYS=false

# Server Configuration
PORT=3000
NODE_ENV=development

# Connection Pool Configuration
POOL_MIN=2
POOL_MAX=10
```

### 3. Start the Server

#### Using pnpm (recommended):

**Development mode (with hot reload):**
```bash
pnpm dev
```

**Production mode:**
```bash
pnpm build
pnpm start
```

#### Using npm:

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

### 4. Verify Operation

Open your browser and go to:
- http://localhost:3000 - API main page
- http://localhost:3000/health - server and database health check

## API Usage Examples

### 1. Get List of Tables

```bash
curl http://localhost:3000/api/query/tables
```

### 2. Execute SQL Query

```bash
curl -X POST http://localhost:3000/api/query/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM your_table LIMIT 10"
  }'
```

### 3. CRUD Operations

#### Get all records from a table:
```bash
curl http://localhost:3000/api/crud/your_table?page=1&limit=10
```

#### Create a new record:
```bash
curl -X POST http://localhost:3000/api/crud/your_table \
  -H "Content-Type: application/json" \
  -d '{
    "column1": "value1",
    "column2": "value2"
  }'
```

#### Update a record:
```bash
curl -X PUT http://localhost:3000/api/crud/your_table/1 \
  -H "Content-Type: application/json" \
  -d '{
    "column1": "new_value"
  }'
```

#### Delete a record:
```bash
curl -X DELETE http://localhost:3000/api/crud/your_table/1
```

### 4. Transactions

```bash
curl -X POST http://localhost:3000/api/transaction/execute \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "sql": "INSERT INTO table1 (col1) VALUES (?)",
        "params": ["value1"]
      },
      {
        "sql": "INSERT INTO table2 (col2) VALUES (?)",
        "params": ["value2"]
      }
    ]
  }'
```

## Project Structure

```
src/
├── config/          # Application configuration
├── database/        # DB connection and CRUD operations
├── middleware/      # Express middleware
├── routes/          # API routes
├── types/           # TypeScript types
├── utils/           # Utilities
├── app.ts           # Express app configuration
└── index.ts         # Server entry point
```

## Available Commands

### Using pnpm (recommended):

- `pnpm dev` - start in development mode
- `pnpm build` - build TypeScript
- `pnpm start` - start production server
- `pnpm lint` - run linter
- `pnpm lint:fix` - fix linter errors
- `pnpm clean` - clean build directory

### Using npm:

- `npm run dev` - start in development mode
- `npm run build` - build TypeScript
- `npm start` - start production server
- `npm run lint` - run linter
- `npm run lint:fix` - fix linter errors
- `npm run clean` - clean build directory

## Security

- All SQL queries are validated for injection
- Rate limiting for requests
- Input data validation
- Secure HTTP headers

## Monitoring

- `/health` - server and DB health check
- Logging of all requests with unique IDs
- Error handling with detailed logging

## Support

If you encounter problems:
1. Check your Firebird database connection
2. Make sure all environment variables are set correctly
3. Check server logs
4. Ensure your Firebird database is running and accessible
