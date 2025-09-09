
# Docker Setup for Node Firebridge

This document describes how to run Node Firebridge using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Quick Start with Docker Compose

### 1. Clone the Repository

```bash
git clone <repository-url>
cd node-firebridge
```

### 2. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Verify Operation

After starting, the services will be available at:

- **Node Firebridge API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Firebird Database**: localhost:3050

## Manual Docker Image Build

### 1. Build the Image

```bash
# Build with pnpm
docker build -t node-firebridge .

# Build with cache
docker build --cache-from node-firebridge -t node-firebridge .
```

### 2. Run the Container

```bash
# Run with environment variables
docker run -d \
  --name node-firebridge \
  -p 3000:3000 \
  -e FIREBIRD_HOST=your-firebird-host \
  -e FIREBIRD_PORT=3050 \
  -e FIREBIRD_DATABASE=/path/to/database.fdb \
  -e FIREBIRD_USER=SYSDBA \
  -e FIREBIRD_PASSWORD=masterkey \
  node-firebridge

# Run with .env file
docker run -d \
  --name node-firebridge \
  -p 3000:3000 \
  --env-file .env \
  node-firebridge
```

## Docker Compose Configuration

### Main Services

#### node-firebridge
- **Port**: 3000
- **Environment Variables**: Firebird and server settings
- **Health Check**: API availability check
- **Restart Policy**: unless-stopped

#### firebird
- **Port**: 3050
- **Image**: jacobalberty/firebird:3.0
- **Volumes**: Persistent data storage
- **Restart Policy**: unless-stopped

### Environment Variables

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - FIREBIRD_HOST=firebird
  - FIREBIRD_PORT=3050
  - FIREBIRD_DATABASE=/firebird/data/database.fdb
  - FIREBIRD_USER=SYSDBA
  - FIREBIRD_PASSWORD=masterkey
  - POOL_MIN=2
  - POOL_MAX=10
```

## Development with Docker

### 1. Create .env File

```bash
cp env.example .env
```

Edit the `.env` file for the Docker environment:

```env
NODE_ENV=development
PORT=3000
FIREBIRD_HOST=firebird
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/firebird/data/database.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey
```

### 2. Start Only the Database

```bash
# Start only Firebird
docker-compose up -d firebird

# Connect to the database
docker-compose exec firebird isql-fb -u SYSDBA -p masterkey
```

### 3. Development with Hot Reload

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  node-firebridge:
    build:
      context: .
      target: base
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: pnpm dev
    depends_on:
      - firebird

  firebird:
    image: jacobalberty/firebird:3.0
    ports:
      - "3050:3050"
    environment:
      - ISC_PASSWORD=masterkey
      - FIREBIRD_DATABASE=database.fdb
    volumes:
      - firebird_data:/firebird/data

volumes:
  firebird_data:
```

Start:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f node-firebridge

# Last 100 lines
docker-compose logs --tail=100 node-firebridge
```

### Resource Monitoring

```bash
# Resource usage
docker stats

# Container info
docker-compose ps
```

### Health Checks

```bash
# Check status
docker-compose ps

# Manual health check
curl http://localhost:3000/health
```

## Data Management

### Database Backup

```bash
# Create backup
docker-compose exec firebird gbak -b -user SYSDBA -password masterkey /firebird/data/database.fdb /firebird/data/backup.fbk

# Copy backup to host
docker cp $(docker-compose ps -q firebird):/firebird/data/backup.fbk ./backup.fbk
```

### Database Restore

```bash
# Copy backup to container
docker cp ./backup.fbk $(docker-compose ps -q firebird):/firebird/data/backup.fbk

# Restore
docker-compose exec firebird gbak -r -user SYSDBA -password masterkey /firebird/data/backup.fbk /firebird/data/database.fdb
```

## Troubleshooting

### Database Connection Issues

```bash
# Check Firebird status
docker-compose exec firebird ps aux | grep firebird

# Check ports
docker-compose exec firebird netstat -tlnp | grep 3050

# Check Firebird logs
docker-compose logs firebird
```

### pnpm Issues

```bash
# Clean pnpm cache
docker-compose exec node-firebridge pnpm store prune

# Reinstall dependencies
docker-compose exec node-firebridge pnpm install
```

### Permission Issues

```bash
# Check user
docker-compose exec node-firebridge whoami

# Change permissions
docker-compose exec node-firebridge chown -R nodejs:nodejs /app
```

## Production Deployment

### 1. Image Optimization

```dockerfile
# Use multi-stage build
FROM node:18-alpine AS base
# ... install dependencies

FROM node:18-alpine AS production
# ... only production dependencies
```

### 2. Security

```bash
# Run with limited privileges
docker run --user 1001:1001 node-firebridge

# Use secrets
docker run --secret firebird_password node-firebridge
```

### 3. Scaling

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  node-firebridge:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## Useful Commands

```bash
# Restart service
docker-compose restart node-firebridge

# Update image
docker-compose pull
docker-compose up -d

# Clean unused resources
docker system prune -a

# View disk usage
docker system df
```

