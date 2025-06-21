# Database Migrations Guide

## Безопасный процесс обновления БД в production

### 1. Разработка и тестирование локально

```bash
# Создание новой миграции для users_database
npm run migrate:create:users -- migration_name

# Создание новой миграции для client_databases
npm run migrate:create:clients -- migration_name

# Применение миграций локально
npm run migrate:run:users
npm run migrate:run:clients
```

### 2. Применение изменений на production сервере

**🚨 КРИТИЧЕСКИ ВАЖНО:** Всегда применяй миграции ДО коммита в master!

**Правильный порядок:**
1. ✅ Применить миграции на production
2. ✅ Убедиться что всё работает
3. ✅ Только потом git push origin master

```bash
# Подключение к EC2
ssh your-server

# Переход в папку backend
cd /path/to/your/backend

# Проверка текущего состояния миграций
NODE_ENV=production npx knex migrate:status --env=production

# Применение миграций для users_database
npm run migrate:run:users:prod

# Применение миграций для всех client databases
npm run migrate:run:clients:prod

# Или применение всех миграций сразу
npm run migrate:deploy
```

### 3. Деплой кода

После успешного применения миграций и проверки их работы:

```bash
git add .
git commit -m "Your changes"
git push origin master  # Теперь безопасно деплоить код
```

## Полезные команды

```bash
# Проверка статуса миграций
NODE_ENV=production npx knex migrate:status --env=production
NODE_ENV=production npx knex migrate:status --env=client_databases

# Откат последней миграции (ОСТОРОЖНО!)
NODE_ENV=production npx knex migrate:rollback --env=production

# Просмотр списка клиентских БД
echo $CLIENT_DATABASES
```

## Структура миграций

- `migrations/users_database/` - миграции для центральной БД пользователей
- `migrations/client_databases/` - миграции для клиентских БД
- `scripts/migrate-clients.js` - скрипт для применения миграций ко всем клиентским БД

## Переменные окружения

```bash
# Production
NODE_ENV=production
CLIENT_DATABASES=dorosh_studio_database,client2_database,client3_database
DB_HOST=localhost
DB_USER=crmuser
DB_PASSWORD=your_password
DB_DATABASE=users_database
```