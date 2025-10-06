/**
 * EXAMPLE: Refactored calendarService using pure functions
 *
 * This is an example showing how to migrate calendarService to use pure functions.
 * This file demonstrates the migration for single service case.
 *
 * Benefits of this approach:
 * - Easier to test (explicit currentTime parameter)
 * - Predictable behavior (no hidden dependencies)
 * - Better separation of concerns (side effects at boundaries)
 */

import {
  getPeriodWithDaysAndEmployeeAvailabilityPure,
  normalizeSavedAppointments,
  normalizeGoogleEventsForEmployees,
  normalizePauseTimesForEmployees,
  normalizeBlockedTimesForEmployees,
  processPeriodAvailability,
  generateTimeSlotsFromDayAvailability,
  groupTimeSlotsForPeriod,
  WorkingDayPure,
  GroupedTimeSlotPure,
} from '@/services/calendar/calendarUtils.adapter.js';
import { getEmployeeBlockedTimesForDates } from '@/services/employees/employeesBlockedTimesService.js';
// import { AppointmentDataType } from '@/@types/appointmentsTypes.js'; // Not used in this example
import { AppointmentStatusEnum } from '@/enums/enums.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { getAppointmentsForCalendar } from '@/services/appointment/appointmentService.js';
import { getGoogleCalendarEventsForSpecificDates } from '@/services/googleCalendar/googleCalendarService.js';
import { getService } from '@/services/service/serviceService.js';
import { getServiceDuration } from '@/utils/timeUtils.js';
import { Pool } from 'mysql2/promise';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { buildGroupedAvailabilityForWeek } from '@/services/calendar/schedulePeriodsAvailabilityService.js';

// Return type for backward compatibility
export interface GroupedTimeSlotsResult {
  day: Date_ISO_Type;
  availableTimeslots: {
    startTime: Time_HH_MM_SS_Type;
    employeeIds: number[];
  }[];
}

/**
 * Get Google Calendar events for specific employees and days
 * Helper function (async side effect)
 */
async function getGoogleCalendarEventsForEmployees(
  dbPool: Pool,
  periodWithDaysAndEmployeeAvailability: WorkingDayPure[],
): Promise<{ start: string; end: string; summary: string }[]> {
  const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];

  if (periodWithDaysAndEmployeeAvailability.length === 0) {
    return googleCalendarEvents;
  }

  // Create employee dates map
  const employeeDatesMap = new Map<number, string[]>();
  periodWithDaysAndEmployeeAvailability.forEach(dayData => {
    dayData.employees.forEach((employee: { employeeId: number }) => {
      if (!employeeDatesMap.has(employee.employeeId)) {
        employeeDatesMap.set(employee.employeeId, []);
      }
      employeeDatesMap.get(employee.employeeId)!.push(dayData.dateISO);
    });
  });

  // Get events for each employee
  for (const [employeeId, dates] of employeeDatesMap) {
    try {
      const employeeGoogleEvents = await getGoogleCalendarEventsForSpecificDates(
        dbPool,
        employeeId,
        dates as Date_ISO_Type[],
      );

      if (employeeGoogleEvents && employeeGoogleEvents.length > 0) {
        googleCalendarEvents.push(...employeeGoogleEvents);
      }
    } catch (error) {
      console.error(`Error loading Google Calendar events for employee ${employeeId}:`, error);
    }
  }

  return googleCalendarEvents;
}

/**
 * Convert pure function result to old format for backward compatibility
 */
function convertToOldFormat(
  groupedTimeSlots: GroupedTimeSlotPure[][],
  dates: Date_ISO_Type[],
): GroupedTimeSlotsResult[] {
  return groupedTimeSlots.map((daySlots, index) => ({
    day: dates[index] || dates[0],
    availableTimeslots: daySlots || [],
  }));
}

/**
 * Get grouped time slots for ONE service (pure function approach)
 *
 * @param dbPool - Database connection pool
 * @param paramDate - Date to get time slots for
 * @param serviceData - Service data (serviceId and employeeIds)
 * @param currentTimeMs - Optional: current time in milliseconds (for testing)
 * @returns Promise with grouped time slots
 *
 * @example
 * // Production use (uses real current time)
 * const slots = await getGroupedTimeSlotsForSingleService(
 *   dbPool,
 *   '2024-01-15',
 *   { serviceId: 1, employeeIds: [1, 2, 3] }
 * );
 *
 * @example
 * // Testing use (fixed time)
 * const slots = await getGroupedTimeSlotsForSingleService(
 *   dbPool,
 *   '2024-01-15',
 *   { serviceId: 1, employeeIds: [1, 2, 3] },
 *   dayjs.utc('2024-01-15 10:00:00').valueOf()
 * );
 */
export const getGroupedTimeSlotsForSingleService = async (
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  serviceData: { serviceId: number; employeeIds: number[] },
  currentTimeMs?: number, // Optional for testing
): Promise<GroupedTimeSlotsResult[]> => {
  const {
    serviceId, employeeIds,
  } = serviceData;

  // Side effect: Get current time at service boundary
  const now = currentTimeMs ?? dayjs().utc().valueOf();

  // Side effect: Get service details from DB
  const service = await getService(dbPool, serviceId);
  const serviceDurationWithBuffer = getServiceDuration(
    service.durationTime,
    service.bufferTime,
  );

  // Side effect: Get employee availability from DB
  const groupedByDay = await buildGroupedAvailabilityForWeek(
    dbPool,
    paramDate,
    employeeIds,
  );

  // ✅ Pure function: Generate period with working times
  const periodWithDaysAndEmployeeAvailability = getPeriodWithDaysAndEmployeeAvailabilityPure(
    paramDate,
    groupedByDay,
    now, // Explicit current time
  );

  // Early return if no working days
  if (periodWithDaysAndEmployeeAvailability.length === 0) {
    return [];
  }

  // Side effects: Get all blocking sources from DB (in parallel for performance)
  const [savedAppointments, googleCalendarEvents, blockedTimes] = await Promise.all([
    getAppointmentsForCalendar(
      dbPool,
      periodWithDaysAndEmployeeAvailability.map(day => day.dateISO),
      employeeIds,
      AppointmentStatusEnum.Active,
    ),
    getGoogleCalendarEventsForEmployees(dbPool, periodWithDaysAndEmployeeAvailability),
    getEmployeeBlockedTimesForDates(
      dbPool,
      employeeIds,
      periodWithDaysAndEmployeeAvailability.map(day => day.dateISO),
    ),
  ]);

  // ✅ Pure functions: Normalize all appointments
  const normalizedSavedAppointments = normalizeSavedAppointments(savedAppointments);
  const normalizedGoogleEvents = normalizeGoogleEventsForEmployees(
    googleCalendarEvents,
    periodWithDaysAndEmployeeAvailability,
  );
  const normalizedPauseTimes = normalizePauseTimesForEmployees(
    periodWithDaysAndEmployeeAvailability,
  );
  const normalizedBlockedTimes = normalizeBlockedTimesForEmployees(
    blockedTimes,
    periodWithDaysAndEmployeeAvailability,
  );

  // ✅ Pure function: Combine all normalized appointments
  const allNormalizedAppointments = [
    ...normalizedSavedAppointments,
    ...normalizedGoogleEvents,
    ...normalizedPauseTimes,
    ...normalizedBlockedTimes,
  ];

  // ✅ Pure function: Calculate availability
  const dayAvailability = processPeriodAvailability(
    periodWithDaysAndEmployeeAvailability,
    allNormalizedAppointments,
    serviceDurationWithBuffer,
    now, // Explicit current time
  );

  // ✅ Pure function: Generate time slots
  const employeeTimeSlotsPerDay = generateTimeSlotsFromDayAvailability(dayAvailability);

  // ✅ Pure function: Group time slots
  const groupedTimeSlots = groupTimeSlotsForPeriod(employeeTimeSlotsPerDay);

  // Convert to old format for backward compatibility
  const dates = periodWithDaysAndEmployeeAvailability.map(day => day.dateISO);
  return convertToOldFormat(groupedTimeSlots, dates);
};

/**
 * SIMPLIFIED VERSION: Using the full pipeline adapter
 *
 * This is even simpler - uses the convenience function from adapter
 */
export const getGroupedTimeSlotsSimplified = async (
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  serviceData: { serviceId: number; employeeIds: number[] },
  currentTimeMs?: number,
): Promise<GroupedTimeSlotsResult[]> => {
  const {
    serviceId, employeeIds,
  } = serviceData;
  const now = currentTimeMs ?? dayjs().utc().valueOf();

  // Get service and availability
  const service = await getService(dbPool, serviceId);
  const serviceDurationWithBuffer = getServiceDuration(
    service.durationTime,
    service.bufferTime,
  );
  const groupedByDay = await buildGroupedAvailabilityForWeek(dbPool, paramDate, employeeIds);

  // Generate period to get dates
  const periodPure = getPeriodWithDaysAndEmployeeAvailabilityPure(
    paramDate,
    groupedByDay,
    now,
  );

  if (periodPure.length === 0) {
    return [];
  }

  // Get all data in parallel
  const [savedAppointments, googleCalendarEvents, blockedTimes] = await Promise.all([
    getAppointmentsForCalendar(
      dbPool,
      periodPure.map(day => day.dateISO),
      employeeIds,
      AppointmentStatusEnum.Active,
    ),
    getGoogleCalendarEventsForEmployees(dbPool, periodPure),
    getEmployeeBlockedTimesForDates(
      dbPool,
      employeeIds,
      periodPure.map(day => day.dateISO),
    ),
  ]);

  // ✅ Use full pipeline adapter - ONE function call!
  // This internally uses all the pure functions
  const { groupedTimeSlots } = await import(`@/services/calendar/calendarUtils.adapter.js`)
    .then(module => module.calculateAvailableTimeSlots(
      paramDate,
      groupedByDay,
      savedAppointments,
      blockedTimes,
      googleCalendarEvents,
      serviceDurationWithBuffer,
      now,
    ));

  // Convert to old format
  const dates = periodPure.map(day => day.dateISO);
  return convertToOldFormat(groupedTimeSlots, dates);
};

/**
 * Example test to show how easy it is now
 */
export const exampleTest = async () => {
  // Mock DB pool
  const mockPool = {} as Pool;

  // Fixed time for reproducible test
  const testTime = dayjs.utc(`2024-01-15 10:00:00`).valueOf();

  const result = await getGroupedTimeSlotsForSingleService(
    mockPool,
    `2024-01-15` as Date_ISO_Type,
    {
      serviceId: 1,
      employeeIds: [1, 2],
    },
    testTime, // ✅ Explicit time = reproducible test!
  );

  // Now we can assert exact values
  console.log(`Test result:`, result);
};

