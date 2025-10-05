# Integration Tests Summary

## Создано

Файл: `src/services/calendar/calendarService.integration.spec.ts`

## Проблема

Тесты написаны, но для их корректной работы нужно исправить структуру mock данных.

### Текущая ошибка

`periodWithDaysAndEmployeeAvailability` возвращает пустой массив, потому что `buildGroupedAvailabilityForWeek` возвращает неправильную структуру данных.

### Правильная структура для `GroupedAvailabilityDayType`

```typescript
interface GroupedAvailabilityDayType {
  dayId: number;  // 0-6 (Sunday-Saturday)
  employees: Array<{
    id: number;  // не employeeId!
    startTime: Time_HH_MM_SS_Type;  // не startWorkingTime!
    endTime: Time_HH_MM_SS_Type;    // не endWorkingTime!
    blockStartTimeFirst: Time_HH_MM_SS_Type | null;
    blockEndTimeFirst: Time_HH_MM_SS_Type | null;
    advanceBookingTime: string;
    timeslotInterval: TimeslotIntervalEnum;
  }>;
}
```

### Что нужно исправить в моках

```typescript
// ❌ Неправильно
mockedBuildGroupedAvailabilityForWeek.mockResolvedValue([
  {
    date: `2024-01-15`,           // ❌ должно быть dayId
    dayOfWeek: 1,                 // ❌ не нужно
    weekNumber: 3,                // ❌ не нужно
    availability: [               // ❌ должно быть employees
      {
        employeeId: 101,          // ❌ должно быть id
        employeeName: `Test`,     // ❌ не нужно
        startWorkingTime: `09:00`,// ❌ должно быть startTime
        endWorkingTime: `17:00`,  // ❌ должно быть endTime
        // ...
      },
    ],
  },
]);

// ✅ Правильно
mockedBuildGroupedAvailabilityForWeek.mockResolvedValue([
  {
    dayId: 1,  // 1 = Monday (dayjs: 0=Sun, 1=Mon, ...)
    employees: [
      {
        id: 101,
        startTime: `09:00:00` as Time_HH_MM_SS_Type,
        endTime: `17:00:00` as Time_HH_MM_SS_Type,
        blockStartTimeFirst: null,
        blockEndTimeFirst: null,
        advanceBookingTime: `00:30:00`,
        timeslotInterval: TimeslotIntervalEnum.Thirty,
      },
    ],
  },
]);
```

## Статус

- ✅ Структура тестов готова (11 тестов)
- ✅ Все моки настроены
- ❌ Нужно исправить структуру данных в моках
- ❌ После исправления тесты должны заработать

## Что покрывают тесты

1. **Single Service - Basic Flow**
   - Возврат доступных слотов без записей
   - Исключение слотов с записями
   - Исключение слотов с blocked times
   - Исключение всего дня при all-day blocked time
   - Исключение pause time (обед)

2. **Multiple Employees**
   - Объединение слотов от нескольких сотрудников
   - Обработка когда один заблокирован, другой доступен

3. **Multi-day Blocked Times (Vacation)**
   - Исключение всех дней в периоде отпуска

4. **Edge Cases**
   - Пустые слоты когда нет availability
   - Ошибка при >2 сервисах
   - Обработка buffer time

## Следующие шаги

1. Исправить структуру моков в тестах (заменить ~50 вхождений)
2. Импортировать `TimeslotIntervalEnum` из enums
3. Запустить тесты
4. Убедиться что все 11 тестов проходят
5. Добавить при необходимости дополнительные сценарии

## Файлы для референса

- `src/@types/employeesTypes.d.ts` - определение `GroupedAvailabilityDayType`
- `src/services/calendar/calendarUtils.spec.ts` - примеры правильных моков (строки 469-484)
- `src/services/calendar/schedulePeriodsAvailabilityService.ts` - реальная реализация

