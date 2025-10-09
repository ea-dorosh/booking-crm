/**
 * Calendar Service - Refactored to use pure functions
 *
 * This service now uses pure functions from calendarUtils.adapter.ts
 * Benefits:
 * - Easier to test (explicit currentTime parameter)
 * - Predictable behavior (no hidden side effects)
 * - Better performance (pure functions can be optimized)
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
  EmployeeWithTimeSlotsPure,
} from '@/services/calendar/calendarUtils.adapter.js';
import { getEmployeeBlockedTimesForDates } from '@/services/employees/employeesBlockedTimesService.js';
import { AppointmentStatusEnum } from '@/enums/enums.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { getAppointmentsForCalendar } from '@/services/appointment/appointmentService.js';
import { getGoogleCalendarEventsForSpecificDates } from '@/services/googleCalendar/googleCalendarService.js';
import { getService } from '@/services/service/serviceService.js';
import { getServiceDuration } from '@/utils/timeUtils.js';
import { Pool } from 'mysql2/promise';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { buildGroupedAvailabilityForWeek } from '@/services/calendar/schedulePeriodsAvailabilityService.js';

// Legacy type for backward compatibility
export interface PeriodWithGroupedTimeslotsType {
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
    dayData.employees.forEach(employee => {
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
  serviceId?: number,
): PeriodWithGroupedTimeslotsType[] {
  return groupedTimeSlots.map((daySlots, index) => ({
    day: dates[index] || dates[0],
    availableTimeslots: (daySlots || []).map(slot => ({
      ...slot,
      serviceId: serviceId,
    })),
  }));
}

/**
 * Process single service with pure functions
 */
async function processSingleService(
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  serviceData: {
    serviceId: number;
    employeeIds: number[];
  },
  currentTimeMs: number,
): Promise<{
  period: WorkingDayPure[];
  employeeTimeSlots: EmployeeWithTimeSlotsPure[];
  serviceDuration: Time_HH_MM_SS_Type;
  serviceId: number;
}> {
  const {
    serviceId, employeeIds,
  } = serviceData;

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

  // ✅ Pure function: Generate period with working times
  const periodWithDaysAndEmployeeAvailability = getPeriodWithDaysAndEmployeeAvailabilityPure(
    paramDate,
    groupedByDay,
    currentTimeMs,
  );

  // Early return if no working days
  if (periodWithDaysAndEmployeeAvailability.length === 0) {
    return {
      period: [],
      employeeTimeSlots: [],
      serviceDuration: service.durationTime,
      serviceId,
    };
  }

  // Get all blocking sources from DB (in parallel for performance)
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

  // 🔍 DEBUG: Log normalized appointments
  console.log(`🔍 DEBUG: Saved appointments:`, JSON.stringify(savedAppointments, null, 2));
  console.log(`🔍 DEBUG: Normalized saved appointments:`, JSON.stringify(normalizedSavedAppointments, null, 2));

  // ✅ Pure function: Combine all normalized appointments
  const allNormalizedAppointments = [
    ...normalizedSavedAppointments,
    ...normalizedGoogleEvents,
    ...normalizedPauseTimes,
    ...normalizedBlockedTimes,
  ];

  // ✅ Pure function: Calculate availability
  console.log(`🔍 DEBUG: All normalized appointments:`, JSON.stringify(allNormalizedAppointments, null, 2));
  console.log(`🔍 DEBUG: Period with days:`, JSON.stringify(periodWithDaysAndEmployeeAvailability, null, 2));

  const dayAvailability = processPeriodAvailability(
    periodWithDaysAndEmployeeAvailability,
    allNormalizedAppointments,
    serviceDurationWithBuffer,
    currentTimeMs,
  );

  console.log(`🔍 DEBUG: Day availability:`, JSON.stringify(dayAvailability, null, 2));

  // ✅ Pure function: Generate time slots
  const employeeTimeSlotsPerDay = generateTimeSlotsFromDayAvailability(dayAvailability, currentTimeMs);

  // Flatten time slots per day into single array
  const employeeTimeSlots = employeeTimeSlotsPerDay.flat();

  return {
    period: periodWithDaysAndEmployeeAvailability,
    employeeTimeSlots,
    serviceDuration: service.durationTime,
    serviceId,
  };
}

/**
 * Combine time slots from two services
 * Finds slots where second service can start after first service ends
 */
function combineTimeSlotsForTwoServices(
  firstServiceSlots: EmployeeWithTimeSlotsPure[],
  secondServiceSlots: EmployeeWithTimeSlotsPure[],
  firstServiceDuration: Time_HH_MM_SS_Type,
): {
  firstServiceEmployeeId: number;
  firstServiceStartTime: number;
  firstServiceEndTime: number;
  secondServiceEmployeeId: number;
  secondServiceStartTime: number;
  secondServiceEndTime: number;
}[] {
  const combinations: {
    firstServiceEmployeeId: number;
    firstServiceStartTime: number;
    firstServiceEndTime: number;
    secondServiceEmployeeId: number;
    secondServiceStartTime: number;
    secondServiceEndTime: number;
  }[] = [];

  // Parse first service duration
  const [hours, minutes, seconds] = firstServiceDuration.split(`:`).map(Number);
  const durationMs = ((hours * 60 + minutes) * 60 + seconds) * 1000;

  // For each first service slot
  for (const firstEmployee of firstServiceSlots) {
    for (const firstSlot of firstEmployee.timeSlots) {
      const firstServiceEndTimeMs = firstSlot.startTimeMs + durationMs;

      // Find matching second service slots
      for (const secondEmployee of secondServiceSlots) {
        for (const secondSlot of secondEmployee.timeSlots) {
          // Check if second service can start right after first (within 30 min window)
          if (
            secondSlot.startTimeMs >= firstServiceEndTimeMs &&
            secondSlot.startTimeMs <= firstServiceEndTimeMs + 30 * 60 * 1000
          ) {
            combinations.push({
              firstServiceEmployeeId: firstEmployee.employeeId,
              firstServiceStartTime: firstSlot.startTimeMs,
              firstServiceEndTime: firstServiceEndTimeMs,
              secondServiceEmployeeId: secondEmployee.employeeId,
              secondServiceStartTime: secondSlot.startTimeMs,
              secondServiceEndTime: secondSlot.endTimeMs,
            });
          }
        }
      }
    }
  }

  return combinations;
}

/**
 * Convert combined slots to grouped format
 */
function convertCombinedSlotsToGroupedFormat(
  combinations: {
    firstServiceEmployeeId: number;
    firstServiceStartTime: number;
    firstServiceEndTime: number;
    secondServiceEmployeeId: number;
    secondServiceStartTime: number;
    secondServiceEndTime: number;
  }[],
  firstServiceId: number,
  secondServiceId: number,
  dates: Date_ISO_Type[],
): PeriodWithGroupedTimeslotsType[] {
  // Group by date (we'll use first date for now, can be improved)
  const timezone = `Europe/Berlin`;

  // Group by first service start time
  const groupedByTime = new Map<string, {
    firstServiceEmployeeIds: Set<number>;
    secondServiceEmployeeIds: Set<number>;
    secondServiceStartTime: string;
  }>();

  for (const combo of combinations) {
    const startTimeStr = dayjs(combo.firstServiceStartTime).tz(timezone).format(`HH:mm:ss`);
    const secondStartTimeStr = dayjs(combo.secondServiceStartTime).tz(timezone).format(`HH:mm:ss`);

    if (!groupedByTime.has(startTimeStr)) {
      groupedByTime.set(startTimeStr, {
        firstServiceEmployeeIds: new Set(),
        secondServiceEmployeeIds: new Set(),
        secondServiceStartTime: secondStartTimeStr,
      });
    }

    const group = groupedByTime.get(startTimeStr)!;
    group.firstServiceEmployeeIds.add(combo.firstServiceEmployeeId);
    group.secondServiceEmployeeIds.add(combo.secondServiceEmployeeId);
  }

  // Convert to result format
  const availableTimeslots = Array.from(groupedByTime.entries())
    .map(([startTime, group]) => ({
      startTime: startTime as Time_HH_MM_SS_Type,
      employeeIds: Array.from(group.firstServiceEmployeeIds),
      serviceId: firstServiceId,
      secondService: {
        startTime: group.secondServiceStartTime as Time_HH_MM_SS_Type,
        employeeIds: Array.from(group.secondServiceEmployeeIds),
        serviceId: secondServiceId,
      },
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return [
    {
      day: dates[0] || (`2024-01-01` as Date_ISO_Type),
      availableTimeslots,
    },
  ];
}

/**
 * Get grouped time slots for one or two services
 * NOW USING PURE FUNCTIONS! 🎉
 *
 * @param dbPool - Database connection pool
 * @param paramDate - Date to get time slots for
 * @param servicesData - Array of service data (serviceId and employeeIds)
 * @returns Promise with grouped time slots
 */
const getGroupedTimeSlots = async (
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  servicesData: {
    serviceId: number;
    employeeIds: number[];
  }[],
): Promise<PeriodWithGroupedTimeslotsType[]> => {

  if (servicesData.length === 0 || servicesData.length > 2) {
    throw new Error(`Unsupported number of services: ${servicesData.length}. Only 1 or 2 services are supported.`);
  }

  // ✅ Get current time at service boundary (side effect)
  const currentTimeMs = dayjs().utc().valueOf();
  console.log(`🔍 DEBUG: Current time:`, dayjs(currentTimeMs).format(`YYYY-MM-DD HH:mm:ss`));
  console.log(`🔍 DEBUG: Test date:`, paramDate);
  console.log(`🔍 DEBUG: Current time UTC:`, dayjs(currentTimeMs).utc().format(`YYYY-MM-DD HH:mm:ss`));
  console.log(`🔍 DEBUG: Current time Berlin:`, dayjs(currentTimeMs).tz(`Europe/Berlin`).format(`YYYY-MM-DD HH:mm:ss`));

  // Process single service
  if (servicesData.length === 1) {
    const result = await processSingleService(
      dbPool,
      paramDate,
      servicesData[0],
      currentTimeMs,
    );

    if (result.period.length === 0) {
      return [];
    }

    // ✅ Pure function: Group time slots
    const groupedTimeSlots = groupTimeSlotsForPeriod([result.employeeTimeSlots]);

    // Convert to old format - include all dates even if no slots
    const dates = result.period.map(day => day.dateISO);
    const converted = convertToOldFormat(groupedTimeSlots, dates, result.serviceId);

    // Ensure all dates from period are in result (even with empty slots)
    const resultMap = new Map(converted.map(item => [item.day, item]));
    return dates.map(date => resultMap.get(date) || {
      day: date,
      availableTimeslots: [],
    });
  }

  // Process two services
  const [firstServiceResult, secondServiceResult] = await Promise.all([
    processSingleService(dbPool, paramDate, servicesData[0], currentTimeMs),
    processSingleService(dbPool, paramDate, servicesData[1], currentTimeMs),
  ]);

  if (firstServiceResult.period.length === 0 || secondServiceResult.period.length === 0) {
    return [];
  }

  // ✅ Combine time slots from two services
  const combinations = combineTimeSlotsForTwoServices(
    firstServiceResult.employeeTimeSlots,
    secondServiceResult.employeeTimeSlots,
    firstServiceResult.serviceDuration,
  );

  // Convert to grouped format
  const dates = firstServiceResult.period.map(day => day.dateISO);
  return convertCombinedSlotsToGroupedFormat(
    combinations,
    firstServiceResult.serviceId,
    secondServiceResult.serviceId,
    dates,
  );
};

export { getGroupedTimeSlots };
