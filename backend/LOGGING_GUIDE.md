# 🚨 Booking CRM - Система Логирования и Мониторинга Ошибок

Комплексное решение для отслеживания и мониторинга ошибок в системе букинга.

## 🚀 Что включено

### 1. **Winston Logger** - Профессиональная система логирования
- ✅ Структурированные JSON логи
- ✅ Автоматическая ротация файлов
- ✅ Разные уровни логирования (error, warn, info, debug)
- ✅ Категоризация логов (booking, calendar, database, validation)
- ✅ Сжатие старых логов

### 2. **Детальное Логирование Календарной Системы**
- ✅ Полное отслеживание процесса генерации временных слотов
- ✅ Логирование Google Calendar интеграции
- ✅ Мониторинг производительности каждого этапа
- ✅ Детальная информация об ошибках

### 3. **HTTP Request/Response Middleware**
- ✅ Логирование всех входящих запросов
- ✅ Автоматическое отслеживание времени ответа
- ✅ Фильтрация чувствительных данных
- ✅ Уникальные ID для трассировки запросов

### 4. **Инструменты Анализа**
- ✅ CLI анализатор логов
- ✅ Real-time мониторинг
- ✅ Веб-dashboard для мониторинга ошибок
- ✅ Статистика и метрики

## 📁 Структура Логов

```
logs/
├── combined-2024-01-15.log     # Все логи за день
├── error-2024-01-15.log        # Только ошибки
├── booking-2024-01-15.log      # Логи связанные с букингом
├── pm2-combined.log            # PM2 логи
├── pm2-out.log                 # PM2 stdout
└── pm2-error.log               # PM2 stderr
```

## 🔧 Настройка и Запуск

### 1. Установка зависимостей
```bash
cd backend
npm install winston winston-daily-rotate-file winston-mongodb express-winston
```

### 2. Запуск с PM2
```bash
# Сборка проекта
npm run build

# Запуск с PM2
pm2 start ecosystem.config.js

# Просмотр логов PM2
pm2 logs booking-backend

# Мониторинг процесса
pm2 monit
```

### 3. Просмотр логов
```bash
# Просмотр всех логов в реальном времени
tail -f logs/combined-$(date +%Y-%m-%d).log

# Просмотр только ошибок
tail -f logs/error-$(date +%Y-%m-%d).log

# Просмотр логов букинга
tail -f logs/booking-$(date +%Y-%m-%d).log
```

## 📊 Анализ Логов

### CLI Анализатор
```bash
# Анализ логов за сегодня
node scripts/log-analyzer.js analyze

# Анализ логов за конкретную дату
node scripts/log-analyzer.js analyze 2024-01-15

# Real-time мониторинг
node scripts/log-analyzer.js monitor
```

### Веб Dashboard
Откройте `monitoring/error-dashboard.html` в браузере для визуального мониторинга.

## 🔍 Типы Логов

### 1. **Ошибки Букинга** (booking_error)
```json
{
  "level": "error",
  "message": "[BOOKING_ERROR] Calendar timeslots retrieval failed",
  "category": "booking",
  "serviceIds": [1, 2],
  "employeeIds": [5, 6],
  "selectedDate": "2024-01-15",
  "step": "calendar_processing",
  "error": "Service not found: 123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. **Календарные Ошибки** (calendar_error)
```json
{
  "level": "error",
  "message": "[CALENDAR_ERROR] Error processing service 1/2",
  "category": "calendar",
  "operation": "get_grouped_timeslots",
  "serviceId": 123,
  "employeeIds": [1, 2],
  "processingTime": 1500,
  "error": "Database connection timeout"
}
```

### 3. **Ошибки Валидации** (validation_error)
```json
{
  "level": "warn",
  "message": "[VALIDATION_ERROR] Invalid servicesData format",
  "category": "validation",
  "field": "employeeIds",
  "validation": "invalid_services_structure",
  "value": []
}
```

### 4. **HTTP Запросы** (http)
```json
{
  "level": "http",
  "message": "Response sent",
  "method": "POST",
  "url": "/api/public/calendar",
  "statusCode": 200,
  "responseTime": 850,
  "requestId": "req-123-456-789"
}
```

## ⚡ Производительность

### Отслеживание медленных запросов
Автоматически логируются запросы > 1000ms:

```json
{
  "level": "info",
  "message": "[PERFORMANCE] Slow request",
  "category": "performance",
  "duration": 3500,
  "url": "/api/public/calendar",
  "method": "POST"
}
```

### Мониторинг Google Calendar API
```json
{
  "level": "info",
  "message": "[GOOGLE_CALENDAR] Getting events for employee",
  "category": "google_calendar",
  "employeeId": 5,
  "dateRange": "2024-01-15 to 2024-01-21",
  "eventsCount": 3,
  "retrievalTime": 450
}
```

## 🚨 Алерты и Мониторинг

### Критические Ошибки
Следите за этими типами ошибок:

1. **Database Errors** - Проблемы с БД
2. **Google Calendar API Errors** - Проблемы с внешним API
3. **Validation Errors** - Неправильные данные от клиентов
4. **Performance Issues** - Медленные запросы (>3s)

### Метрики для Мониторинга
- Общее количество ошибок в час
- Процент успешных букингов
- Время ответа календарных запросов
- Количество ошибок Google Calendar API

## 🔧 Настройка Уведомлений

### Email уведомления (расширение)
```javascript
// В будущем можно добавить
import nodemailer from 'nodemailer';

const sendErrorAlert = (error) => {
  if (error.level === 'error' && error.category === 'booking') {
    // Отправить email админу
  }
};
```

### Slack/Discord интеграция
```javascript
// Webhook для критических ошибок
const sendToSlack = (error) => {
  if (error.level === 'error') {
    // POST to Slack webhook
  }
};
```

## 📱 Мобильные Уведомления

### Push уведомления через Telegram Bot
```javascript
// Telegram bot для критических ошибок
const sendTelegramAlert = (error) => {
  // Отправка в Telegram канал
};
```

## 🔧 Конфигурация

### Environment Variables
```env
# Уровень логирования
LOG_LEVEL=info  # production: info, development: debug

# Rotation настройки
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### PM2 Ecosystem
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'booking-backend',
    max_log_size: '50M',
    retain_log: 30,
    log_type: 'json',
    merge_logs: true
  }]
};
```

## 🚀 Рекомендации

### 1. **Ежедневный Мониторинг**
- Проверяйте dashboard каждое утро
- Анализируйте топ ошибки за прошедший день
- Следите за трендами производительности

### 2. **Еженедельный Анализ**
```bash
# Анализ всех логов за неделю
for date in $(seq -f "%04g-%02g-%02g" 2024 01 08 2024 01 14); do
  node scripts/log-analyzer.js analyze $date
done
```

### 3. **Автоматизация**
```bash
# Cron job для ежедневного анализа
0 6 * * * cd /path/to/backend && node scripts/log-analyzer.js analyze $(date -d "yesterday" +\%Y-\%m-\%d) > /path/to/reports/daily-$(date +\%Y-\%m-\%d).txt
```

## 🆘 Troubleshooting

### Частые Проблемы

1. **Нет логов**
   - Проверьте права доступа к папке `logs/`
   - Убедитесь что Winston настроен правильно

2. **Логи не ротируются**
   - Проверьте настройки `winston-daily-rotate-file`
   - Убедитесь что есть место на диске

3. **PM2 логи не видны**
   - `pm2 flush` - очистить логи
   - `pm2 reload ecosystem.config.js` - перезагрузить конфиг

### Команды Диагностики
```bash
# Проверка размера логов
du -sh logs/

# Количество ошибок за последний час
grep '"level":"error"' logs/combined-$(date +%Y-%m-%d).log | tail -100

# Самые частые ошибки
grep '"level":"error"' logs/error-$(date +%Y-%m-%d).log | jq -r '.message' | sort | uniq -c | sort -nr | head -10
```

## 📈 Метрики Успеха

### KPI для Мониторинга
- **Error Rate**: < 1% от общего количества запросов
- **Response Time**: 95% запросов < 2s
- **Availability**: > 99.9% uptime
- **Booking Success Rate**: > 95%

---

## 🎯 Результат

Теперь у тебя есть полноценная система мониторинга, которая позволит:

✅ **Видеть все ошибки пользователей** в реальном времени
✅ **Детально дебажить проблемы** с полным контекстом
✅ **Отслеживать производительность** системы букинга
✅ **Получать уведомления** о критических проблемах
✅ **Анализировать тренды** и улучшать систему

**Запусти систему и начни мониторить ошибки прямо сейчас!** 🚀

## 🚀 GitHub Actions Интеграция

### Автоматическое Развертывание с Логированием
GitHub Actions workflow теперь автоматически:
- ✅ Копирует все файлы логирования на сервер
- ✅ Сохраняет существующие логи при деплое
- ✅ Настраивает PM2 с ротацией логов
- ✅ Запускает приложение с ecosystem.config.js

### Автоматический Мониторинг
Добавлены новые workflows:

#### 1. **Log Monitoring (каждые 4 часа)**
```yaml
# .github/workflows/log-monitoring.yml
- Проверяет статус приложения
- Анализирует ошибки за день
- Мониторит производительность
- Проверяет ротацию логов
- Отправляет еженедельные отчеты
```

#### 2. **Emergency Health Check (ручной запуск)**
```yaml
# .github/workflows/emergency-check.yml
- Критическая диагностика системы
- Автоматический перезапуск (опционально)
- Детальный анализ логов
- Экстренные уведомления
```

### Настройка GitHub Secrets
Добавь эти секреты в настройки репозитория:

```bash
# Основные секреты (уже есть)
EC2_HOST=your-server.com
EC2_USER=ubuntu
EC2_SSH_KEY=your-private-key
EC2_DEPLOY_PATH=/path/to/deployment

# Новые секреты для уведомлений
SLACK_WEBHOOK=https://hooks.slack.com/...  # Slack уведомления
ALERT_EMAIL=admin@yourcompany.com          # Email уведомления

# SMTP настройки (для email уведомлений)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

### Ручные Команды
```bash
# Экстренная проверка системы
gh workflow run emergency-check.yml

# Экстренная проверка с перезапуском
gh workflow run emergency-check.yml \
  -f restart_app=true \
  -f log_analysis_days=3

# Форсированный деплой с логированием
gh workflow run deploy.yml
```

### Monitoring Dashboard через GitHub
После деплоя dashboard доступен по адресу:
```
http://your-server.com/monitoring/error-dashboard.html
```

### Автоматические Алерты
Система автоматически отправит уведомления при:
- 🚨 Падении приложения
- 📊 Высоком уровне ошибок (>10 за час)
- ⚡ Проблемах с производительностью
- 💾 Проблемах с логами или диском
- 🔄 Проблемах с ротацией логов
