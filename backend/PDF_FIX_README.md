# PDF Generation Fix for Production

## Проблема
На продакшн сервере (EC2) возникала ошибка при генерации PDF инвойсов:
```
Browser was not found at the configured executablePath (/usr/bin/google-chrome-stable)
```

## Решение
Обновлена конфигурация Puppeteer для работы без установленного системного Chrome:

### Изменения в коде:
1. **Добавлены новые зависимости** в `package.json`:
   - `puppeteer-core@^24.1.1` - core версия без встроенного Chromium
   - `@sparticuz/chromium@^131.0.0` - оптимизированный Chromium для серверных сред

2. **Обновлена логика запуска браузера** в `src/routes/invoices/invoicesRoute.ts`:
   - Для продакшена: используется `@sparticuz/chromium`
   - Для разработки: используется обычный `puppeteer`
   - Добавлено правильное закрытие браузера для предотвращения утечек памяти

### Деплой на продакшен:

#### Вариант 1: Автоматический деплой
```bash
# На продакшн сервере
cd /path/to/backend
./deploy-pdf-fix.sh
```

#### Вариант 2: Ручной деплой
```bash
# 1. Установить новые зависимости
npm install puppeteer-core@^24.1.1 @sparticuz/chromium@^131.0.0

# 2. Собрать проект
npm run build

# 3. Перезапустить приложение
pm2 restart all
```

#### Вариант 3: SSH деплой
```bash
# Подключение к серверу
ssh -i "~/.ssh/eu-central-t3.small.pem" ubuntu@18.195.52.51

# Затем выполнить команды из Варианта 2
```

## Тестирование
После деплоя протестируйте эндпоинт:
```
GET /api/protected/invoices/{id}/pdf
```

## Мониторинг логов
```bash
# Просмотр логов PM2
pm2 logs

# Или для конкретного процесса
pm2 logs booking-backend
```

## Преимущества нового решения:
- ✅ Не требует установки Chrome на сервере
- ✅ Оптимизировано для серверных сред
- ✅ Меньший размер и лучшая производительность
- ✅ Автоматическое управление памятью
- ✅ Совместимость с различными ОС

## Откат (если что-то пойдет не так):
```bash
# Удалить новые зависимости
npm uninstall puppeteer-core @sparticuz/chromium

# Восстановить предыдущую версию кода из git
git checkout HEAD~1 -- src/routes/invoices/invoicesRoute.ts

# Пересобрать и перезапустить
npm run build && pm2 restart all
```
