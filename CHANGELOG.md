# Changelog

Все изменения в проекте Node Firebridge документируются в этом файле.

## [1.1.0] - 2024-01-01

### Added
- **pnpm Support**: Полная поддержка pnpm как менеджера пакетов
- **Docker Configuration**: Dockerfile и docker-compose.yml для контейнеризации
- **Enhanced Documentation**: 
  - PNPM_SETUP.md - руководство по установке и настройке pnpm
  - DOCKER.md - подробное руководство по Docker
  - GETTING_STARTED.md - обновлен с инструкциями для pnpm
- **Package Management**: 
  - pnpm-workspace.yaml для workspace конфигурации
  - .npmrc с настройками pnpm
  - Обновленные скрипты в package.json
- **Build Improvements**:
  - Добавлен скрипт `clean` для очистки директории сборки
  - Добавлен `rimraf` для кроссплатформенной очистки
  - Pre/post build хуки

### Changed
- **README.md**: Обновлен с инструкциями для pnpm и Docker
- **package.json**: Добавлены новые скрипты и зависимости
- **.gitignore**: Добавлена поддержка pnpm debug логов

### Technical Details
- Multi-stage Docker build с оптимизацией для продакшна
- Health checks для Docker контейнеров
- Автоматическая установка pnpm в Docker образе
- Поддержка как pnpm, так и npm для обратной совместимости

## [1.0.0] - 2024-01-01

### Added
- **Initial Release**: Первый релиз Node Firebridge
- **Core Features**:
  - Полная поддержка CRUD операций для Firebird
  - Транзакции с ACID свойствами
  - Выполнение произвольных SQL запросов
  - Безопасность и валидация
  - TypeScript поддержка
- **API Endpoints**:
  - `/api/query/*` - выполнение SQL запросов
  - `/api/crud/*` - CRUD операции
  - `/api/transaction/*` - транзакции
  - `/health` - мониторинг состояния
- **Security Features**:
  - Rate limiting
  - SQL injection protection
  - Input validation
  - CORS support
- **Monitoring**:
  - Request logging
  - Error tracking
  - Health checks
- **Documentation**:
  - Подробный README
  - API документация
  - Примеры использования

### Technical Stack
- Node.js 18+
- TypeScript 5.3+
- Express.js
- node-firebird-driver-native
- Joi для валидации
- ESLint для линтинга
- Nodemon для разработки

## Migration Guide

### From 1.0.0 to 1.1.0

#### Package Manager Migration

**From npm to pnpm:**

1. Удалите старые файлы:
```bash
rm -rf node_modules package-lock.json
```

2. Установите pnpm:
```bash
npm install -g pnpm
```

3. Установите зависимости:
```bash
pnpm install
```

4. Используйте pnpm команды:
```bash
# Вместо npm run dev
pnpm dev

# Вместо npm run build
pnpm build
```

#### Docker Migration

1. Используйте новый Dockerfile:
```bash
docker build -t node-firebridge .
```

2. Или используйте Docker Compose:
```bash
docker-compose up -d
```

### Breaking Changes

- Нет breaking changes в API
- Все существующие npm команды продолжают работать
- Docker конфигурация новая, но не влияет на существующие развертывания

## Future Roadmap

### Planned Features
- [ ] Authentication and Authorization
- [ ] API Rate Limiting per User
- [ ] Database Connection Pooling Optimization
- [ ] GraphQL Support
- [ ] WebSocket Support for Real-time Updates
- [ ] Database Migration Tools
- [ ] Advanced Caching Layer
- [ ] Metrics and Analytics Dashboard

### Performance Improvements
- [ ] Query Optimization
- [ ] Connection Pool Tuning
- [ ] Memory Usage Optimization
- [ ] Response Time Improvements

### Developer Experience
- [ ] Hot Module Replacement
- [ ] Better Error Messages
- [ ] API Documentation Generator
- [ ] Testing Framework Integration
- [ ] CI/CD Pipeline Templates

