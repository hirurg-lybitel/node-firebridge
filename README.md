# Node Firebridge: TypeScript REST API for Firebird Databases

A production-ready REST API server built with TypeScript and node-firebird, offering full CRUD operations, transactional queries, and modern Firebird 3+ support. Designed for robust integration, maintainability, and extensibility.

## Features

- 🚀 **Full CRUD Operations** - Create, Read, Update, Delete operations for any Firebird table
- 🔄 **Transaction Support** - Batch operations with ACID compliance
- 📊 **Advanced Querying** - Execute custom SQL queries with safety validation
- 🛡️ **Security** - Rate limiting, input validation, SQL injection protection
- 📈 **Performance** - Connection pooling, optimized queries, pagination
- 🔍 **Monitoring** - Health checks, request logging, error tracking
- 📝 **TypeScript** - Full type safety and IntelliSense support
- 🏗️ **Production Ready** - Graceful shutdown, error handling, logging


## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Firebird 3.0+ database
- TypeScript knowledge (optional but recommended)

### Installation

#### Using pnpm

```bash
# Clone the repository
git clone <repository-url>
cd node-firebridge

# Install dependencies with pnpm
pnpm install

# Copy environment configuration
cp env.example .env

# Edit .env with your Firebird database settings
```

### Configuration

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

### Running the Server

#### Using pnpm

```bash
# Development mode with hot reload
pnpm dev

# Production build
pnpm build
pnpm start

# Other useful commands
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix ESLint errors
pnpm clean         # Clean build directory
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Currently, the API does not implement authentication. In production, you should add authentication middleware.

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_1234567890_abc123"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_1234567890_abc123"
}
```

## API Endpoints

### Health Check

#### GET /health
Check server and database connectivity.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "connected": true,
    "host": "localhost",
    "port": 3050,
    "database": "/path/to/database.fdb"
  }
}
```

### Query Operations

#### POST /api/query/execute
Execute custom SQL queries.

**Request Body:**
```json
{
  "sql": "SELECT * FROM users WHERE age > ?",
  "params": [18],
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "John", "age": 25 },
    { "id": 2, "name": "Jane", "age": 30 }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### POST /api/query/command
Execute SQL commands (INSERT, UPDATE, DELETE).

**Request Body:**
```json
{
  "sql": "INSERT INTO users (name, age) VALUES (?, ?)",
  "params": ["John", 25]
}
```

#### GET /api/query/tables
Get list of all tables in the database.

#### GET /api/query/tables/:table/schema
Get table schema information.

#### GET /api/query/database/info
Get database information.

### CRUD Operations

#### GET /api/crud/:table
Get all records from a table with pagination and filtering.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 100, max: 1000)
- `offset` - Offset for pagination
- `columns` - Comma-separated list of columns to select
- `where` - WHERE clause
- `q` - Search term

**Example:**
```
GET /api/crud/users?page=1&limit=10&q=john
```

#### GET /api/crud/:table/:id
Get a specific record by ID.

#### POST /api/crud/:table
Create a new record.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

#### PUT /api/crud/:table/:id
Update a record by ID.

**Request Body:**
```json
{
  "name": "John Smith",
  "age": 31
}
```

#### DELETE /api/crud/:table/:id
Delete a record by ID.

#### GET /api/crud/:table/count
Get count of records in a table.

### Transaction Operations

#### POST /api/transaction/execute
Execute multiple operations in a transaction.

**Request Body:**
```json
{
  "operations": [
    {
      "sql": "INSERT INTO users (name, email) VALUES (?, ?)",
      "params": ["John", "john@example.com"]
    },
    {
      "sql": "INSERT INTO profiles (user_id, bio) VALUES (?, ?)",
      "params": [1, "Software developer"]
    }
  ],
  "isolation": "READ_COMMITTED"
}
```

#### POST /api/transaction/batch-insert
Batch insert multiple records.

**Request Body:**
```json
{
  "table": "users",
  "records": [
    { "name": "John", "email": "john@example.com" },
    { "name": "Jane", "email": "jane@example.com" }
  ]
}
```

#### POST /api/transaction/batch-update
Batch update multiple records.

#### POST /api/transaction/batch-delete
Batch delete multiple records.

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All inputs are validated using Joi schemas
- **SQL Injection Protection**: Dangerous SQL operations are blocked
- **CORS Support**: Configurable CORS policies
- **Security Headers**: Helmet.js security headers
- **Request Logging**: Comprehensive request/response logging

## Development

### Project Structure

```
src/
├── config/          # Configuration files
├── database/        # Database connection and CRUD operations
├── middleware/      # Express middleware
├── routes/          # API route handlers
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── app.ts           # Express app configuration
└── index.ts         # Server entry point
```

### Available Scripts

#### Using pnpm

```bash
pnpm dev             # Start development server with hot reload
pnpm build           # Build TypeScript to JavaScript
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm lint:fix        # Fix ESLint errors
pnpm clean           # Clean build directory
pnpm test            # Run tests (when implemented)
```

### Adding New Features

1. Create new route files in `src/routes/`
2. Add validation schemas in `src/middleware/validation.ts`
3. Update types in `src/types/`
4. Add tests in `src/tests/` (when implemented)

## Production Deployment

### Environment Variables

Set these environment variables in production:

```env
NODE_ENV=production
PORT=3000
FIREBIRD_HOST=your-firebird-host
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/path/to/production.fdb
FIREBIRD_USER=your-user
FIREBIRD_PASSWORD=your-secure-password
POOL_MIN=5
POOL_MAX=20
```

### Docker Support

The project includes Docker configuration with pnpm support:

```bash
# Quick start with Docker Compose
docker-compose up -d

# Build and run manually
docker build -t node-firebridge .
docker run -p 3000:3000 --env-file .env node-firebridge
```

See [DOCKER.md](DOCKER.md) for detailed Docker setup instructions.

### Monitoring

The server provides several monitoring endpoints:

- `/health` - Health check
- Request logging with request IDs
- Error tracking and logging
- Database connection monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Documentation

- [Getting Started Guide](GETTING_STARTED.md) - Quick setup instructions
- [Docker Guide](DOCKER.md) - Docker setup and deployment

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples