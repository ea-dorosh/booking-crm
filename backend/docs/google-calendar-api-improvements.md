# Google Calendar API Improvements

## Новые API Endpoints

### 1. Получение статуса интеграции (улучшенный)
```
GET /api/protected/google-calendar/:employeeId/google-calendar-status
```

**Ответ:**
```json
{
  "enabled": true,
  "calendarId": "primary",
  "tokenExpired": false,
  "googleEmail": "user@example.com",
  "lastUsed": "2024-07-02T10:30:00.000Z",
  "errorCount": 0,
  "lastError": null,
  "needsReconnection": false
}
```

### 2. Проактивное обновление токенов
```
POST /api/protected/google-calendar/proactive-refresh
```

**Ответ:**
```json
{
  "success": true,
  "message": "Proactive token refresh completed",
  "result": {
    "refreshed": 5,
    "failed": 0,
    "inactive": 1
  }
}
```

### 3. Статистика интеграций
```
GET /api/protected/google-calendar/integration-stats
```

**Ответ:**
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "active": 8,
    "inactive": 2,
    "problematic": 1,
    "averageErrorCount": "0.30",
    "lastActivity": "2024-07-02T10:30:00.000Z"
  }
}
```

### 4. Проверка проблемных интеграций (обновленный)
```
POST /api/protected/google-calendar/check-all-integrations
```

Теперь возвращает только интеграции которые нуждаются в внимании (is_active = false OR error_count >= 3).

## Изменения в поведении

### Отключение интеграции
- **Раньше:** Полное удаление записи из базы данных
- **Теперь:** Установка `is_active = false` с указанием причины

### Обработка ошибок
- **Раньше:** Удаление токена при первой ошибке `invalid_grant`
- **Теперь:** Постепенное увеличение счетчика ошибок, отключение только после 5 ошибок подряд

### Автоматическое обновление
- **Раньше:** Токены обновлялись только при использовании
- **Теперь:** Проактивное обновление каждые 4 часа

## Scheduler задачи

### Проактивное обновление
- **Частота:** Каждые 4 часа
- **Функция:** `scheduleProactiveTokenRefresh()`
- **Что делает:** Обновляет все активные токены превентивно

### Проверка проблемных интеграций
- **Частота:** Раз в день в 03:00
- **Функция:** `scheduleGoogleCalendarTokenRefresh()`
- **Что делает:** Отправляет email админу о проблемных интеграциях

## Миграция базы данных

Добавлены новые поля в таблицу `EmployeeGoogleCalendar`:

```sql
ALTER TABLE EmployeeGoogleCalendar ADD COLUMN expires_at TIMESTAMP NULL;
ALTER TABLE EmployeeGoogleCalendar ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE EmployeeGoogleCalendar ADD COLUMN last_used_at TIMESTAMP NULL;
ALTER TABLE EmployeeGoogleCalendar ADD COLUMN error_count INT DEFAULT 0;
ALTER TABLE EmployeeGoogleCalendar ADD COLUMN last_error TEXT NULL;
ALTER TABLE EmployeeGoogleCalendar ADD COLUMN google_email VARCHAR(255) NULL;
```

## Тестирование

Для тестирования новых функций можно использовать следующие curl команды:

```bash
# Получить статистику интеграций
curl -X GET "http://localhost:8000/api/protected/google-calendar/integration-stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Запустить проактивное обновление
curl -X POST "http://localhost:8000/api/protected/google-calendar/proactive-refresh" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Получить улучшенный статус интеграции
curl -X GET "http://localhost:8000/api/protected/google-calendar/1/google-calendar-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```