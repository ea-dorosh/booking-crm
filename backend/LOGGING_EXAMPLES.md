# 🚨 Примеры Использования Системы Логирования

## 📝 Как логировать в своем коде

### 1. Импорт логгера
```typescript
import bookingLogger from '@/services/logger/loggerService.js';
```

### 2. Основные методы логирования

#### Ошибки букинга
```typescript
bookingLogger.bookingError('Ошибка при создании букинга', {
  requestId: req.requestId,
  userId: req.user?.id,
  serviceIds: [1, 2],
  employeeIds: [5, 6],
  selectedDate: '2024-01-15',
  timeSlot: '10:00:00',
  step: 'appointment_creation',
  customerData: { email: 'user@example.com' },
  error: error as Error
});
```

#### Календарные ошибки
```typescript
bookingLogger.calendarError('Не удалось получить слоты', {
  requestId: req.requestId,
  operation: 'get_timeslots',
  dateRange: '2024-01-15 to 2024-01-21',
  employeeIds: [1, 2, 3],
  serviceId: 123,
  error: error as Error
});
```

#### Ошибки валидации
```typescript
bookingLogger.validationError('Неправильный формат email', {
  requestId: req.requestId,
  field: 'customerEmail',
  value: 'invalid-email',
  validation: 'email_format',
  userId: req.user?.id
});
```

#### Ошибки базы данных
```typescript
bookingLogger.dbError('Ошибка подключения к БД', {
  requestId: req.requestId,
  query: 'SELECT * FROM appointments WHERE date = ?',
  table: 'appointments',
  operation: 'select',
  error: error as Error
});
```

#### API ошибки
```typescript
bookingLogger.apiError('Ошибка внешнего API', {
  requestId: req.requestId,
  url: req.originalUrl,
  method: req.method,
  statusCode: 500,
  error: error as Error
});
```

### 3. Успешные операции

#### Успешный букинг
```typescript
bookingLogger.bookingSuccess('Букинг создан успешно', {
  requestId: req.requestId,
  appointmentId: newAppointment.id,
  serviceIds: [1, 2],
  employeeIds: [5, 6],
  selectedDate: '2024-01-15',
  timeSlot: '10:00:00',
  customerEmail: 'user@example.com'
});
```

### 4. Действия пользователя
```typescript
bookingLogger.userAction('Пользователь выбрал время', {
  requestId: req.requestId,
  userId: req.user?.id,
  action: 'timeslot_selection',
  selectedDate: '2024-01-15',
  selectedTime: '10:00:00',
  serviceId: 123
});
```

### 5. Мониторинг производительности
```typescript
const startTime = Date.now();
// ... выполнение операции ...
const duration = Date.now() - startTime;

bookingLogger.performance('Генерация слотов календаря', duration, {
  requestId: req.requestId,
  operation: 'calendar_generation',
  serviceId: 123,
  employeeCount: 5
});
```

### 6. Внешние API
```typescript
bookingLogger.externalApi('Google Calendar', 'get_events', {
  requestId: req.requestId,
  responseStatus: 200,
  responseTime: 450,
  requestData: { employeeId: 5, dateRange: '2024-01-15' },
  responseData: { eventsCount: 3 }
});
```

### 7. Google Calendar специфично
```typescript
bookingLogger.googleCalendar('Получение событий', {
  requestId: req.requestId,
  employeeId: 5,
  calendarId: 'primary',
  dateRange: '2024-01-15 to 2024-01-21',
  eventsFound: 3
});
```

## 🔧 Примеры для разных сценариев

### Создание нового appointment
```typescript
export const createAppointment = async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    bookingLogger.userAction('Начало создания букинга', {
      requestId: req.requestId,
      userId: req.user?.id,
      companyDomain: req.headers.domain as string,
      appointmentData: req.body
    });

    // Валидация
    if (!req.body.serviceId) {
      bookingLogger.validationError('ServiceId обязателен', {
        requestId: req.requestId,
        field: 'serviceId',
        validation: 'required',
        receivedData: req.body
      });
      return res.status(400).json({ error: 'ServiceId required' });
    }

    // Получение данных
    const service = await getService(req.dbPool, req.body.serviceId);
    if (!service) {
      bookingLogger.bookingError('Сервис не найден', {
        requestId: req.requestId,
        serviceId: req.body.serviceId,
        step: 'service_lookup'
      });
      return res.status(404).json({ error: 'Service not found' });
    }

    // Создание букинга
    const appointment = await createNewAppointment(req.dbPool, req.body);

    bookingLogger.bookingSuccess('Букинг создан успешно', {
      requestId: req.requestId,
      appointmentId: appointment.id,
      serviceId: req.body.serviceId,
      employeeId: req.body.employeeId,
      selectedDate: req.body.date,
      processingTime: Date.now() - startTime
    });

    res.json(appointment);

  } catch (error) {
    bookingLogger.bookingError('Ошибка создания букинга', {
      requestId: req.requestId,
      error: error as Error,
      appointmentData: req.body,
      processingTime: Date.now() - startTime,
      step: 'appointment_creation'
    });

    res.status(500).json({ error: 'Internal Server Error' });
  }
};
```

### Обработка внешнего API
```typescript
export const syncGoogleCalendar = async (employeeId: number) => {
  const startTime = Date.now();

  try {
    bookingLogger.googleCalendar('Начало синхронизации с Google Calendar', {
      employeeId,
      operation: 'sync_start'
    });

    const events = await googleCalendarAPI.getEvents(employeeId);

    bookingLogger.externalApi('Google Calendar', 'get_events', {
      employeeId,
      responseStatus: 200,
      responseTime: Date.now() - startTime,
      responseData: { eventsCount: events.length }
    });

    // Обработка событий...

  } catch (error) {
    bookingLogger.googleCalendar('Ошибка синхронизации', {
      employeeId,
      error: error as Error,
      operation: 'sync_failed',
      processingTime: Date.now() - startTime
    });

    throw error;
  }
};
```

### Database операции с логированием
```typescript
export const getAppointmentsByDate = async (dbPool: Pool, date: string) => {
  const startTime = Date.now();
  const query = 'SELECT * FROM appointments WHERE date = ?';

  try {
    bookingLogger.debug('Выполнение запроса к БД', {
      table: 'appointments',
      operation: 'select',
      query: query,
      parameters: { date }
    });

    const result = await dbPool.execute(query, [date]);

    bookingLogger.debug('Запрос выполнен успешно', {
      table: 'appointments',
      operation: 'select',
      resultCount: result[0].length,
      queryTime: Date.now() - startTime
    });

    return result[0];

  } catch (error) {
    bookingLogger.dbError('Ошибка выполнения запроса', {
      table: 'appointments',
      operation: 'select',
      query: query,
      parameters: { date },
      error: error as Error,
      queryTime: Date.now() - startTime
    });

    throw error;
  }
};
```

## 📊 Контекстные данные

### Обязательные поля для booking ошибок
```typescript
{
  requestId: string,     // Уникальный ID запроса
  serviceIds?: number[], // ID сервисов
  employeeIds?: number[],// ID сотрудников
  selectedDate?: string, // Выбранная дата
  timeSlot?: string,     // Выбранное время
  step?: string          // Этап процесса где произошла ошибка
}
```

### Полезные поля для всех логов
```typescript
{
  requestId?: string,        // ID запроса
  userId?: number,           // ID пользователя
  sessionId?: string,        // ID сессии
  companyDomain?: string,    // Домен компании
  userAgent?: string,        // User-Agent браузера
  ip?: string,              // IP адрес
  processingTime?: number,   // Время выполнения в ms
  error?: Error             // Объект ошибки
}
```

## 🎯 Best Practices

### 1. Всегда логируй важные этапы
```typescript
// ❌ Плохо - только результат
const result = await someComplexOperation();
bookingLogger.info('Операция завершена', { result });

// ✅ Хорошо - весь процесс
bookingLogger.info('Начало сложной операции', { params });
const result = await someComplexOperation();
bookingLogger.info('Операция завершена успешно', { result, processingTime });
```

### 2. Логируй контекст, не только ошибки
```typescript
// ❌ Плохо - только факт ошибки
bookingLogger.error('Ошибка', { error });

// ✅ Хорошо - полный контекст
bookingLogger.bookingError('Не удалось создать букинг', {
  requestId: req.requestId,
  step: 'appointment_validation',
  customerData: req.body,
  serviceId: req.body.serviceId,
  error: error as Error
});
```

### 3. Используй правильные уровни
```typescript
// Для отладки
bookingLogger.debug('Детали процесса', { data });

// Для информации
bookingLogger.info('Операция выполнена', { result });

// Для предупреждений
bookingLogger.warn('Медленная операция', { duration: 5000 });

// Для ошибок
bookingLogger.error('Критическая ошибка', { error });
```

### 4. Логируй производительность
```typescript
const measureTime = (operation: string) => {
  const startTime = Date.now();
  return {
    end: (context?: any) => {
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        bookingLogger.performance(operation, duration, context);
      }
    }
  };
};

// Использование
const timer = measureTime('calendar_generation');
const result = await generateCalendar();
timer.end({ serviceId: 123, resultCount: result.length });
```

### 5. Не логируй чувствительные данные
```typescript
// ❌ Плохо - пароли в логах
bookingLogger.info('Данные пользователя', {
  user: { email: 'user@example.com', password: 'secret123' }
});

// ✅ Хорошо - только нужная информация
bookingLogger.info('Данные пользователя', {
  user: { email: 'user@example.com', id: 123 }
});
```

## 🔍 Мониторинг в Production

### Автоматические алерты
```typescript
// Пример: отправка в Slack при критических ошибках
if (error.level === 'error' && error.category === 'booking') {
  // Отправить уведомление в Slack
  await sendSlackAlert(error);
}
```

### Метрики для мониторинга
```typescript
// Подсчет ошибок по типам
const errorCounts = {
  booking: 0,
  calendar: 0,
  database: 0,
  validation: 0
};

// Время ответа по операциям
const responseTimes = {
  calendar_generation: [],
  appointment_creation: [],
  google_calendar_sync: []
};
```

---

Эти примеры помогут тебе правильно логировать все аспекты работы системы букинга! 🚀
