# Docker Setup для Node Firebridge

Этот документ описывает, как запустить Node Firebridge с помощью Docker и Docker Compose.

## Предварительные требования

- Docker 20.10+
- Docker Compose 2.0+

## Быстрый старт с Docker Compose

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd node-firebridge
```

### 2. Запуск с Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка сервисов
docker-compose down
```

### 3. Проверка работы

После запуска сервисы будут доступны по адресам:

- **Node Firebridge API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Firebird Database**: localhost:3050

## Ручная сборка Docker образа

### 1. Сборка образа

```bash
# Сборка с pnpm
docker build -t node-firebridge .

# Сборка с кэшированием
docker build --cache-from node-firebridge -t node-firebridge .
```

### 2. Запуск контейнера

```bash
# Запуск с переменными окружения
docker run -d \
  --name node-firebridge \
  -p 3000:3000 \
  -e FIREBIRD_HOST=your-firebird-host \
  -e FIREBIRD_PORT=3050 \
  -e FIREBIRD_DATABASE=/path/to/database.fdb \
  -e FIREBIRD_USER=SYSDBA \
  -e FIREBIRD_PASSWORD=masterkey \
  node-firebridge

# Запуск с файлом .env
docker run -d \
  --name node-firebridge \
  -p 3000:3000 \
  --env-file .env \
  node-firebridge
```

## Конфигурация Docker Compose

### Основные сервисы

#### node-firebridge
- **Порт**: 3000
- **Переменные окружения**: Настройки Firebird и сервера
- **Health Check**: Проверка доступности API
- **Restart Policy**: unless-stopped

#### firebird
- **Порт**: 3050
- **Образ**: jacobalberty/firebird:3.0
- **Volumes**: Постоянное хранение данных
- **Restart Policy**: unless-stopped

### Переменные окружения

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

## Разработка с Docker

### 1. Создание .env файла

```bash
cp env.example .env
```

Отредактируйте `.env` файл для Docker окружения:

```env
NODE_ENV=development
PORT=3000
FIREBIRD_HOST=firebird
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/firebird/data/database.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey
```

### 2. Запуск только базы данных

```bash
# Запуск только Firebird
docker-compose up -d firebird

# Подключение к базе данных
docker-compose exec firebird isql-fb -u SYSDBA -p masterkey
```

### 3. Разработка с hot reload

Создайте `docker-compose.dev.yml`:

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

Запуск:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Мониторинг и логи

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f node-firebridge

# Последние 100 строк
docker-compose logs --tail=100 node-firebridge
```

### Мониторинг ресурсов

```bash
# Использование ресурсов
docker stats

# Информация о контейнерах
docker-compose ps
```

### Health Checks

```bash
# Проверка состояния
docker-compose ps

# Ручная проверка health check
curl http://localhost:3000/health
```

## Управление данными

### Бэкап базы данных

```bash
# Создание бэкапа
docker-compose exec firebird gbak -b -user SYSDBA -password masterkey /firebird/data/database.fdb /firebird/data/backup.fbk

# Копирование бэкапа на хост
docker cp $(docker-compose ps -q firebird):/firebird/data/backup.fbk ./backup.fbk
```

### Восстановление базы данных

```bash
# Копирование бэкапа в контейнер
docker cp ./backup.fbk $(docker-compose ps -q firebird):/firebird/data/backup.fbk

# Восстановление
docker-compose exec firebird gbak -r -user SYSDBA -password masterkey /firebird/data/backup.fbk /firebird/data/database.fdb
```

## Troubleshooting

### Проблемы с подключением к базе данных

```bash
# Проверка статуса Firebird
docker-compose exec firebird ps aux | grep firebird

# Проверка портов
docker-compose exec firebird netstat -tlnp | grep 3050

# Проверка логов Firebird
docker-compose logs firebird
```

### Проблемы с pnpm

```bash
# Очистка кэша pnpm
docker-compose exec node-firebridge pnpm store prune

# Переустановка зависимостей
docker-compose exec node-firebridge pnpm install
```

### Проблемы с правами доступа

```bash
# Проверка пользователя
docker-compose exec node-firebridge whoami

# Изменение прав
docker-compose exec node-firebridge chown -R nodejs:nodejs /app
```

## Продакшн развертывание

### 1. Оптимизация образа

```dockerfile
# Используйте multi-stage build
FROM node:18-alpine AS base
# ... установка зависимостей

FROM node:18-alpine AS production
# ... только production зависимости
```

### 2. Безопасность

```bash
# Запуск с ограниченными правами
docker run --user 1001:1001 node-firebridge

# Использование secrets
docker run --secret firebird_password node-firebridge
```

### 3. Масштабирование

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

## Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart node-firebridge

# Обновление образа
docker-compose pull
docker-compose up -d

# Очистка неиспользуемых ресурсов
docker system prune -a

# Просмотр использования места
docker system df
```

