# Настройка pnpm для Node Firebridge

pnpm - это быстрый, эффективный менеджер пакетов для Node.js, который использует жесткие ссылки для экономии места на диске и ускорения установки пакетов.

## Установка pnpm

### Windows

#### Через npm (рекомендуется):
```bash
npm install -g pnpm
```

#### Через PowerShell:
```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

#### Через Chocolatey:
```bash
choco install pnpm
```

#### Через Scoop:
```bash
scoop install nodejs-lts pnpm
```

### macOS

#### Через npm:
```bash
npm install -g pnpm
```

#### Через Homebrew:
```bash
brew install pnpm
```

#### Через curl:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Linux

#### Через npm:
```bash
npm install -g pnpm
```

#### Через curl:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

#### Через wget:
```bash
wget -qO- https://get.pnpm.io/install.sh | sh -
```

## Проверка установки

После установки проверьте версию pnpm:

```bash
pnpm --version
```

## Основные команды pnpm

### Установка зависимостей

```bash
# Установка всех зависимостей из package.json
pnpm install

# Установка конкретного пакета
pnpm add <package-name>

# Установка пакета как dev dependency
pnpm add -D <package-name>

# Установка пакета глобально
pnpm add -g <package-name>
```

### Управление зависимостями

```bash
# Удаление пакета
pnpm remove <package-name>

# Обновление всех пакетов
pnpm update

# Обновление конкретного пакета
pnpm update <package-name>

# Просмотр устаревших пакетов
pnpm outdated
```

### Выполнение скриптов

```bash
# Выполнение скрипта из package.json
pnpm <script-name>

# Примеры для Node Firebridge:
pnpm dev          # Запуск в режиме разработки
pnpm build        # Сборка проекта
pnpm start        # Запуск продакшн сервера
pnpm lint         # Проверка кода линтером
pnpm lint:fix     # Исправление ошибок линтера
```

## Преимущества pnpm

### 1. Экономия места на диске
- Использует жесткие ссылки для хранения пакетов
- Один пакет хранится только один раз, даже если используется в нескольких проектах

### 2. Быстрая установка
- Установка пакетов происходит быстрее чем в npm
- Кэширование пакетов для повторного использования

### 3. Строгая изоляция
- Предотвращает доступ к пакетам, которые не объявлены в зависимостях
- Более безопасная работа с зависимостями

### 4. Совместимость
- Полная совместимость с npm
- Работает с существующими package.json файлами

## Конфигурация для Node Firebridge

Проект уже настроен для работы с pnpm:

### .npmrc
```ini
auto-install-peers=true
strict-peer-dependencies=false
save-exact=false
prefer-frozen-lockfile=true
```

### pnpm-workspace.yaml
```yaml
packages:
  - '.'
```

## Миграция с npm на pnpm

Если у вас уже есть проект с npm:

1. Удалите `node_modules` и `package-lock.json`:
```bash
rm -rf node_modules package-lock.json
```

2. Установите зависимости через pnpm:
```bash
pnpm install
```

3. Используйте команды pnpm вместо npm:
```bash
# Вместо npm run dev
pnpm dev

# Вместо npm run build
pnpm build
```

## Troubleshooting

### Проблемы с правами доступа (Linux/macOS)

Если возникают проблемы с правами доступа:

```bash
# Установка pnpm в пользовательскую директорию
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Проблемы с PATH

Убедитесь, что pnpm добавлен в PATH:

```bash
# Добавьте в ~/.bashrc или ~/.zshrc
export PATH="$HOME/.local/share/pnpm:$PATH"
```

### Очистка кэша

Если возникают проблемы с кэшем:

```bash
pnpm store prune
```

## Дополнительные ресурсы

- [Официальная документация pnpm](https://pnpm.io/)
- [Сравнение менеджеров пакетов](https://pnpm.io/benchmarks)
- [Миграция с npm на pnpm](https://pnpm.io/installation#using-npm)

