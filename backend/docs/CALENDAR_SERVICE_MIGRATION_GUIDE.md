# Calendar Service Migration Guide

## Как использовать чистые функции в calendarService

Этот гайд показывает как постепенно мигрировать `calendarService` на использование чистых функций через адаптеры.

## Текущая структура (старая)

```typescript
// calendarService.ts (текущая версия)
const getGroupedTimeSlots = async (...) => {
  // ❌ Использует старые impure функции
  const periodWithDaysAndEmployeeAvailability = 
    getPeriodWithDaysAndEmployeeAvailability(paramDate, groupedByDay);
  
  const normalizedSavedAppointments = 
    normalizeSavedAppointments(savedAppointments);
  
  const periodWithClearedDays = 
    combinePeriodWithNormalizedAppointments(...);
  
  const timeSlotsData = 
    generateTimeSlotsFromAvailableTimes(periodWithClearedDays);
  
  return generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsData);
};
```

## Подход 1: Простая замена (рекомендуется для начала)

Заменяем старые функции на адаптеры **для одного сервиса**:

```typescript
// calendarService.ts (новая версия)
import {
  calculateAvailableTimeSlots,
  normalizeSavedAppointments,
  normalizeGoogleEventsForEmployees,
  normalizePauseTimesForEmployees,
  normalizeBlockedTimesForEmployees,
  getPeriodWithDaysAndEmployeeAvailabilityPure,
  processPeriodAvailability,
  generateTimeSlotsFromDayAvailability,
  groupTimeSlotsForPeriod,
} from '@/services/calendar/calendarUtils.adapter.js';

const getGroupedTimeSlotsForSingleService = async (
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  serviceData: { serviceId: number; employeeIds: number[] },
): Promise<PeriodWithGroupedTimeslotsType[]> => {
  const { serviceId, employeeIds } = serviceData;

  // Get service details
  const service = await getService(dbPool, serviceId);
  const serviceDurationWithBuffer = getServiceDuration(
    service.durationTime,
    service.bufferTime,
  );

  // Get employee availability
  const groupedByDay = await buildGroupedAvailabilityForWeek(
    dbPool,
    paramDate,
    employeeIds,
  );

  // Get appointments and events (async операции остаются)
  const periodPure = getPeriodWithDaysAndEmployeeAvailabilityPure(
    paramDate,
    groupedByDay,
    // currentTime передается явно (можно опустить для production)
  );

  let savedAppointments: AppointmentDataType[] = [];
  if (periodPure.length > 0) {
    savedAppointments = await getAppointmentsForCalendar(
      dbPool,
      periodPure.map(day => day.dateISO),
      employeeIds,
      AppointmentStatusEnum.Active,
    );
  }

  const googleCalendarEvents = await getGoogleCalendarEventsForEmployees(
    dbPool,
    periodPure,
  );

  const blockedTimes = await getEmployeeBlockedTimesForDates(
    dbPool,
    employeeIds,
    periodPure.map(day => day.dateISO),
  );

  // ✅ Используем полный pipeline adapter
  const { groupedTimeSlots } = calculateAvailableTimeSlots(
    paramDate,
    groupedByDay,
    savedAppointments,
    blockedTimes,
    googleCalendarEvents,
    serviceDurationWithBuffer,
    // Для тестов можно передать фиксированное время
  );

  // Конвертируем в старый формат для обратной совместимости
  return convertToOldFormat(groupedTimeSlots, paramDate, serviceId);
};
```

## Подход 2: Пошаговая миграция

Заменяем функции по одной, тестируя каждый шаг:

### Шаг 1: Заменить getPeriodWithDaysAndEmployeeAvailability

```typescript
// До:
const periodWithDaysAndEmployeeAvailability = 
  getPeriodWithDaysAndEmployeeAvailability(paramDate, groupedByDay);

// После:
import { getPeriodWithDaysAndEmployeeAvailabilityPure } 
  from '@/services/calendar/calendarUtils.adapter.js';

const periodWithDaysAndEmployeeAvailability = 
  getPeriodWithDaysAndEmployeeAvailabilityPure(
    paramDate,
    groupedByDay,
    // Опционально: dayjs().utc().valueOf() для явного времени
  );
```

### Шаг 2: Заменить normalization функции

```typescript
// До:
import { 
  normalizeSavedAppointments,
  normalizeGoogleEventsForEmployees,
  normalizePauseTimesForEmployees,
  normalizeBlockedTimesForEmployees,
} from '@/services/calendar/calendarUtils.js';

// После:
import { 
  normalizeSavedAppointments,
  normalizeGoogleEventsForEmployees,
  normalizePauseTimesForEmployees,
  normalizeBlockedTimesForEmployees,
} from '@/services/calendar/calendarUtils.adapter.js';

// Функции имеют тот же API, но используют чистые функции внутри
```

### Шаг 3: Заменить processing pipeline

```typescript
// До:
const periodWithClearedDays = combinePeriodWithNormalizedAppointments(
  periodWithDaysAndEmployeeAvailability,
  allNormalizedAppointments,
  serviceDurationWithBuffer,
  service.durationTime,
  serviceId,
);

const timeSlotsData = generateTimeSlotsFromAvailableTimes(periodWithClearedDays);

// После:
import { 
  processPeriodAvailability,
  generateTimeSlotsFromDayAvailability,
} from '@/services/calendar/calendarUtils.adapter.js';

const dayAvailability = processPeriodAvailability(
  periodWithDaysAndEmployeeAvailability,
  allNormalizedAppointments,
  serviceDurationWithBuffer,
  // Опционально: currentTimeMs
);

const employeeTimeSlotsPerDay = generateTimeSlotsFromDayAvailability(dayAvailability);
```

## Подход 3: Полный рефакторинг (для будущего)

Создать новую версию сервиса полностью на чистых функциях:

```typescript
// calendarService.pure.ts (новый файл)
import {
  calculateAvailableTimeSlots,
  WorkingDayPure,
  DayAvailabilityPure,
  GroupedTimeSlotPure,
} from '@/services/calendar/calendarUtils.adapter.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';

/**
 * Get grouped time slots using pure functions
 * Side effects (DB queries, current time) are explicit
 */
const getGroupedTimeSlotsPure = async (
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  serviceData: { serviceId: number; employeeIds: number[] },
  currentTimeMs?: number, // Для тестирования
): Promise<{
  period: WorkingDayPure[];
  dayAvailability: DayAvailabilityPure[];
  groupedTimeSlots: GroupedTimeSlotPure[][];
}> => {
  // Получаем current time на границе сервиса
  const now = currentTimeMs ?? dayjs().utc().valueOf();

  const { serviceId, employeeIds } = serviceData;

  // Все async операции (DB queries)
  const [service, groupedByDay, savedAppointments, googleEvents, blockedTimes] = 
    await Promise.all([
      getService(dbPool, serviceId),
      buildGroupedAvailabilityForWeek(dbPool, paramDate, employeeIds),
      getAppointmentsForCalendar(dbPool, [paramDate], employeeIds, AppointmentStatusEnum.Active),
      getGoogleCalendarEventsAsync(dbPool, paramDate, employeeIds),
      getEmployeeBlockedTimesForDates(dbPool, employeeIds, [paramDate]),
    ]);

  const serviceDurationWithBuffer = getServiceDuration(
    service.durationTime,
    service.bufferTime,
  );

  // ✅ Вся логика чистая - легко тестировать!
  return calculateAvailableTimeSlots(
    paramDate,
    groupedByDay,
    savedAppointments,
    blockedTimes,
    googleEvents,
    serviceDurationWithBuffer,
    now, // Explicit current time
  );
};
```

## Преимущества каждого подхода

### Подход 1: Простая замена
**Плюсы:**
- Минимальные изменения в коде
- Быстрая миграция
- Обратная совместимость

**Минусы:**
- Требует конверсию между форматами
- Не все преимущества чистых функций

**Когда использовать:** Для быстрой миграции одного сервиса

### Подход 2: Пошаговая миграция
**Плюсы:**
- Постепенная миграция
- Можно тестировать каждый шаг
- Безопасно

**Минусы:**
- Требует времени
- Промежуточное состояние с mixed кодом

**Когда использовать:** Когда нужна аккуратная миграция без рисков

### Подход 3: Полный рефакторинг
**Плюсы:**
- Максимум преимуществ чистых функций
- Легко тестировать
- Чистая архитектура

**Минусы:**
- Требует больше всего времени
- Нужно переписать тесты

**Когда использовать:** Для нового кода или major refactoring

## Пример: Миграция для двух сервисов

Для случая с двумя сервисами нужно вызвать функцию дважды:

```typescript
const getGroupedTimeSlotsForTwoServices = async (
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  servicesData: { serviceId: number; employeeIds: number[] }[],
): Promise<PeriodWithGroupedTimeslotsType[]> => {
  if (servicesData.length !== 2) {
    throw new Error('This function requires exactly 2 services');
  }

  const now = dayjs().utc().valueOf();

  // Process both services
  const [firstServiceResult, secondServiceResult] = await Promise.all(
    servicesData.map(async (serviceData) => {
      const { serviceId, employeeIds } = serviceData;
      
      // ... get service details, appointments, etc.
      
      return calculateAvailableTimeSlots(
        paramDate,
        groupedByDay,
        savedAppointments,
        blockedTimes,
        googleEvents,
        serviceDurationWithBuffer,
        now, // Same current time for both services
      );
    })
  );

  // Combine results from two services
  return combineResultsFromTwoServices(
    firstServiceResult,
    secondServiceResult,
  );
};
```

## Testing преимущества

С чистыми функциями тесты становятся проще:

```typescript
// До: Сложный тест с моками
describe('calendarService', () => {
  it('should calculate time slots', async () => {
    // Mock dayjs
    jest.spyOn(dayjs, 'utc').mockReturnValue(...);
    
    // Mock DB calls
    const mockPool = createMockPool();
    
    // Complex setup
    const result = await getGroupedTimeSlots(mockPool, date, services);
    
    expect(result).toBeDefined();
  });
});

// После: Простой тест
describe('calendarService.pure', () => {
  it('should calculate time slots', async () => {
    // No mocks needed for pure functions!
    const currentTime = dayjs.utc('2024-01-15 10:00:00').valueOf();
    
    // Only mock DB calls (side effects)
    const mockPool = createMockPool();
    
    const result = await getGroupedTimeSlotsPure(
      mockPool,
      date,
      serviceData,
      currentTime, // Explicit time = reproducible test
    );
    
    // Easy to assert specific values
    expect(result.groupedTimeSlots[0].availableTimeslots).toHaveLength(10);
    expect(result.groupedTimeSlots[0].availableTimeslots[0].startTime).toBe('10:00:00');
  });
});
```

## Рекомендуемый план миграции

1. **Week 1:** Migrate `getPeriodWithDaysAndEmployeeAvailability` to pure version
   - Replace imports
   - Test thoroughly
   - Deploy

2. **Week 2:** Migrate normalization functions
   - Replace all normalize* imports
   - Test
   - Deploy

3. **Week 3:** Migrate processing pipeline
   - Use `processPeriodAvailability` and related adapters
   - Test
   - Deploy

4. **Week 4:** Refactor for single service
   - Use full `calculateAvailableTimeSlots` adapter
   - Test
   - Deploy

5. **Future:** Handle two services case
   - Implement two-services logic with pure functions
   - Comprehensive testing
   - Deploy

## Конвертация форматов

Если нужна обратная совместимость, вот helper для конверсии:

```typescript
function convertToOldFormat(
  groupedTimeSlots: GroupedTimeSlotPure[][],
  date: Date_ISO_Type,
  serviceId: number,
): PeriodWithGroupedTimeslotsType[] {
  return groupedTimeSlots.map((daySlots, index) => ({
    day: date as Date_ISO_Type,
    availableTimeslots: daySlots.map(slot => ({
      startTime: slot.startTime,
      employeeIds: slot.employeeIds,
    })),
  }));
}
```

## Вопросы и ответы

### Q: Нужно ли переписывать все сразу?
**A:** Нет! Адаптеры позволяют мигрировать постепенно. Начните с одной функции.

### Q: Что делать с существующими тестами?
**A:** Они продолжат работать! Адаптеры совместимы. Постепенно упрощайте тесты, убирая моки.

### Q: Как тестировать с фиксированным временем?
**A:** Передайте `currentTimeMs` в адаптеры:
```typescript
const result = calculateAvailableTimeSlots(
  ...,
  dayjs.utc('2024-01-15 10:00:00').valueOf()
);
```

### Q: Работает ли это в production?
**A:** Да! Если не передать `currentTimeMs`, адаптер использует реальное текущее время.

## Заключение

Адаптеры делают миграцию безопасной и постепенной. Начните с простой замены, протестируйте, и постепенно двигайтесь к полностью чистой архитектуре.

**Главное преимущество:** Можешь мигрировать в своем темпе, без big-bang изменений! 🚀

