# Getting Started with Node Firebridge

Этот документ поможет вам быстро запустить Node Firebridge API сервер.

## Быстрый старт

### 1. Установка зависимостей

#### Используя pnpm (рекомендуется):

```bash
# Установка pnpm (если не установлен)
npm install -g pnpm

# Установка зависимостей
pnpm install
```

#### Используя npm:

```bash
npm install
```

### 2. Настройка базы данных

Скопируйте файл конфигурации:
```bash
cp env.example .env
```

Отредактируйте `.env` файл с настройками вашей базы данных Firebird:

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

### 3. Запуск сервера

#### Используя pnpm (рекомендуется):

**Режим разработки (с hot reload):**
```bash
pnpm dev
```

**Продакшн режим:**
```bash
pnpm build
pnpm start
```

#### Используя npm:

**Режим разработки (с hot reload):**
```bash
npm run dev
```

**Продакшн режим:**
```bash
npm run build
npm start
```

### 4. Проверка работы

Откройте браузер и перейдите по адресу:
- http://localhost:3000 - главная страница API
- http://localhost:3000/health - проверка состояния сервера и базы данных

## Примеры использования API

### 1. Получение списка таблиц

```bash
curl http://localhost:3000/api/query/tables
```

### 2. Выполнение SQL запроса

```bash
curl -X POST http://localhost:3000/api/query/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM your_table LIMIT 10"
  }'
```

### 3. CRUD операции

#### Получение всех записей из таблицы:
```bash
curl http://localhost:3000/api/crud/your_table?page=1&limit=10
```

#### Создание новой записи:
```bash
curl -X POST http://localhost:3000/api/crud/your_table \
  -H "Content-Type: application/json" \
  -d '{
    "column1": "value1",
    "column2": "value2"
  }'
```

#### Обновление записи:
```bash
curl -X PUT http://localhost:3000/api/crud/your_table/1 \
  -H "Content-Type: application/json" \
  -d '{
    "column1": "new_value"
  }'
```

#### Удаление записи:
```bash
curl -X DELETE http://localhost:3000/api/crud/your_table/1
```

### 4. Транзакции

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

## Структура проекта

```
src/
├── config/          # Конфигурация приложения
├── database/        # Подключение к БД и CRUD операции
├── middleware/      # Express middleware
├── routes/          # API маршруты
├── types/           # TypeScript типы
├── utils/           # Утилиты
├── app.ts           # Конфигурация Express приложения
└── index.ts         # Точка входа сервера
```

## Доступные команды

### Используя pnpm (рекомендуется):

- `pnpm dev` - запуск в режиме разработки
- `pnpm build` - сборка TypeScript
- `pnpm start` - запуск продакшн сервера
- `pnpm lint` - проверка кода линтером
- `pnpm lint:fix` - исправление ошибок линтера
- `pnpm clean` - очистка директории сборки

### Используя npm:

- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка TypeScript
- `npm start` - запуск продакшн сервера
- `npm run lint` - проверка кода линтером
- `npm run lint:fix` - исправление ошибок линтера
- `npm run clean` - очистка директории сборки

## Безопасность

- Все SQL запросы валидируются на предмет инъекций
- Ограничение скорости запросов (rate limiting)
- Валидация входных данных
- Безопасные заголовки HTTP

## Мониторинг

- `/health` - проверка состояния сервера и БД
- Логирование всех запросов с уникальными ID
- Обработка ошибок с детальным логированием

## Поддержка

При возникновении проблем:
1. Проверьте подключение к базе данных Firebird
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте логи сервера
4. Убедитесь, что база данных Firebird запущена и доступна
