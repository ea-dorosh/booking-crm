/**
 * Calendar Service - Using pure functions
 *
 * This service uses pure functions from calendarUtils.pure.ts for both single and two services
 * Benefits:
 * - Easier to test (explicit currentTime parameter)
 * - Predictable behavior (no hidden side effects)
 * - Better performance (pure functions can be optimized)
 * - 100% API compatibility with master branch
 */

import {
  calculateAvailableTimeSlotsForTwoServices,
  WorkingDayPure,
  GroupedTimeSlotPure,
  EmployeeWithTimeSlotsPure,
} from '@/services/calendar/calendarUtils.pure.js';
import {
  getPeriodWithDaysAndEmployeeAvailabilityPure,
  normalizeSavedAppointments,
  normalizeGoogleEventsForEmployees,
  normalizeBlockedTimesForEmployees,
  processPeriodAvailability,
  generateTimeSlotsFromDayAvailability,
  groupTimeSlotsForPeriod,
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
  periodWithDaysAndEmployeeAvailability: any[],
): Promise<{ start: string; end: string; summary: string }[]> {
  const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];

  if (periodWithDaysAndEmployeeAvailability.length === 0) {
    return googleCalendarEvents;
  }

  // Create employee dates map
  const employeeDatesMap = new Map<number, string[]>();
  console.log(`🔍 DEBUG: getGoogleCalendarEventsForEmployees - periodWithDaysAndEmployeeAvailability:`, JSON.stringify(periodWithDaysAndEmployeeAvailability, null, 2));
  periodWithDaysAndEmployeeAvailability.forEach(dayData => {
    console.log(`🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData:`, dayData);
    dayData.employees.forEach((employee: any) => {
      if (!employeeDatesMap.has(employee.employeeId)) {
        employeeDatesMap.set(employee.employeeId, []);
      }
      const dateISO = dayData.dateISO || dayData.day; // Support both pure and legacy formats
      console.log(`🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO:`, dateISO);
      employeeDatesMap.get(employee.employeeId)!.push(dateISO);
    });
  });
  console.log(`🔍 DEBUG: getGoogleCalendarEventsForEmployees - employeeDatesMap:`, employeeDatesMap);

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
  console.log(`🔍 DEBUG: convertToOldFormat - groupedTimeSlots.length:`, groupedTimeSlots.length);
  console.log(`🔍 DEBUG: convertToOldFormat - dates:`, dates);
  console.log(`🔍 DEBUG: convertToOldFormat - serviceId:`, serviceId);
  console.log(`🔍 DEBUG: convertToOldFormat - groupedTimeSlots:`, JSON.stringify(groupedTimeSlots.map((daySlots, index) => ({
    day: dates[index] || dates[0],
    slotsCount: daySlots?.length || 0,
    slots: daySlots?.map(slot => slot.startTime) || [],
  })), null, 2));

  return groupedTimeSlots.map((daySlots, index) => ({
    day: dates[index] || dates[0],
    availableTimeslots: (daySlots || []).map(slot => ({
      startTime: slot.startTime,
      employeeIds: slot.employeeIds,
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
  employeeTimeSlots: EmployeeWithTimeSlotsPure[][];
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
  // REMOVED: normalizedPauseTimes - pause times are already in employee.pauseTimes
  const normalizedBlockedTimes = normalizeBlockedTimesForEmployees(
    blockedTimes,
    periodWithDaysAndEmployeeAvailability,
  );

  // ✅ Pure function: Combine all normalized appointments (NO pause times - they're in employee.pauseTimes)
  const allNormalizedAppointments = [
    ...normalizedSavedAppointments,
    ...normalizedGoogleEvents,
    ...normalizedBlockedTimes,
  ];

  // DEBUG: Log all blocking sources for service
  console.log(`\n🔍 DEBUG [FEATURE] Service ${serviceId} - Employee IDs: ${employeeIds.join(`,`)}`);
  console.log(`📅 Saved Appointments (${normalizedSavedAppointments.length}):`);
  normalizedSavedAppointments.forEach(apt => {
    const startTime = new Date(apt.startTimeMs).toISOString();
    const endTime = new Date(apt.endTimeMs).toISOString();
    console.log(`  - Employee ${apt.employeeId}: ${apt.dateISO} ${startTime} - ${endTime}`);
  });
  console.log(`📅 Google Events (${normalizedGoogleEvents.length}):`);
  normalizedGoogleEvents.forEach(evt => {
    const startTime = new Date(evt.startTimeMs).toISOString();
    const endTime = new Date(evt.endTimeMs).toISOString();
    console.log(`  - Employee ${evt.employeeId}: ${evt.dateISO} ${startTime} - ${endTime}`);
  });
  console.log(`⏸️ Pause Times (from employee.pauseTimes):`);
  periodWithDaysAndEmployeeAvailability.forEach(day => {
    day.employees.forEach(emp => {
      if (emp.pauseTimes && emp.pauseTimes.length > 0) {
        emp.pauseTimes.forEach(pause => {
          const startTime = new Date(pause.startPauseTimeMs).toISOString();
          const endTime = new Date(pause.endPauseTimeMs).toISOString();
          console.log(`  - Employee ${emp.employeeId}: ${day.dateISO} ${startTime} - ${endTime}`);
        });
      }
    });
  });
  console.log(`🚫 Blocked Times (${normalizedBlockedTimes.length}):`);
  normalizedBlockedTimes.forEach(block => {
    const startTime = new Date(block.startTimeMs).toISOString();
    const endTime = new Date(block.endTimeMs).toISOString();
    console.log(`  - Employee ${block.employeeId}: ${block.dateISO} ${startTime} - ${endTime}`);
  });

  const dayAvailability = processPeriodAvailability(
    periodWithDaysAndEmployeeAvailability,
    allNormalizedAppointments,
    serviceDurationWithBuffer,
    currentTimeMs,
  );


  // ✅ Pure function: Generate time slots
  const employeeTimeSlotsPerDay = generateTimeSlotsFromDayAvailability(dayAvailability, currentTimeMs);

  console.log(`🔍 DEBUG: employeeTimeSlotsPerDay.length:`, employeeTimeSlotsPerDay.length);
  console.log(`🔍 DEBUG: employeeTimeSlotsPerDay:`, employeeTimeSlotsPerDay.map((day, index) => ({
    day: index,
    employeesCount: day.length,
    employees: day.map(emp => ({
      employeeId: emp.employeeId,
      slotsCount: emp.timeSlots.length,
    })),
  })));


  return {
    period: periodWithDaysAndEmployeeAvailability,
    employeeTimeSlots: employeeTimeSlotsPerDay,
    serviceDuration: service.durationTime,
    serviceId,
  };
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
    const groupedTimeSlots = groupTimeSlotsForPeriod(result.employeeTimeSlots);

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

  // ✅ For two services, use PURE FUNCTIONS!
  const [firstServiceResult, secondServiceResult] = await Promise.all([
    processSingleService(dbPool, paramDate, servicesData[0], currentTimeMs),
    processSingleService(dbPool, paramDate, servicesData[1], currentTimeMs),
  ]);

  if (firstServiceResult.period.length === 0 || secondServiceResult.period.length === 0) {
    return [];
  }

  // Get blocking data for both services
  const [firstServiceBlockingData, secondServiceBlockingData] = await Promise.all([
    // Get blocking data for first service
    (async () => {
      const savedAppointments = await getAppointmentsForCalendar(
        dbPool,
        firstServiceResult.period.map(day => day.dateISO),
        servicesData[0].employeeIds,
        AppointmentStatusEnum.Active,
      );
      const googleCalendarEvents = await getGoogleCalendarEventsForEmployees(dbPool, firstServiceResult.period);
      const blockedTimes = await getEmployeeBlockedTimesForDates(
        dbPool,
        servicesData[0].employeeIds,
        firstServiceResult.period.map(day => day.dateISO),
      );

      const normalizedSavedAppointments = normalizeSavedAppointments(savedAppointments);
      const normalizedGoogleEvents = normalizeGoogleEventsForEmployees(googleCalendarEvents, firstServiceResult.period);
      const normalizedBlockedTimes = normalizeBlockedTimesForEmployees(blockedTimes, firstServiceResult.period);
      // NOTE: pause times are already in employee.pauseTimes and processed by processPeriodAvailability

      const allNormalizedAppointments = [
        ...normalizedSavedAppointments,
        ...normalizedGoogleEvents,
        ...normalizedBlockedTimes,
      ];

      const service = await getService(dbPool, servicesData[0].serviceId);
      const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);

      return {
        period: firstServiceResult.period,
        dayAvailability: processPeriodAvailability(
          firstServiceResult.period,
          allNormalizedAppointments,
          serviceDurationWithBuffer,
          currentTimeMs,
        ),
        groupedTimeSlots: [],
        serviceId: firstServiceResult.serviceId,
        serviceDuration: firstServiceResult.serviceDuration,
      };
    })(),
    // Get blocking data for second service
    (async () => {
      const savedAppointments = await getAppointmentsForCalendar(
        dbPool,
        secondServiceResult.period.map(day => day.dateISO),
        servicesData[1].employeeIds,
        AppointmentStatusEnum.Active,
      );
      const googleCalendarEvents = await getGoogleCalendarEventsForEmployees(dbPool, secondServiceResult.period);
      const blockedTimes = await getEmployeeBlockedTimesForDates(
        dbPool,
        servicesData[1].employeeIds,
        secondServiceResult.period.map(day => day.dateISO),
      );

      const normalizedSavedAppointments = normalizeSavedAppointments(savedAppointments);
      const normalizedGoogleEvents = normalizeGoogleEventsForEmployees(googleCalendarEvents, secondServiceResult.period);
      const normalizedBlockedTimes = normalizeBlockedTimesForEmployees(blockedTimes, secondServiceResult.period);
      // NOTE: pause times are already in employee.pauseTimes and processed by processPeriodAvailability

      const allNormalizedAppointments = [
        ...normalizedSavedAppointments,
        ...normalizedGoogleEvents,
        ...normalizedBlockedTimes,
      ];

      const service = await getService(dbPool, servicesData[1].serviceId);
      const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);

      return {
        period: secondServiceResult.period,
        dayAvailability: processPeriodAvailability(
          secondServiceResult.period,
          allNormalizedAppointments,
          serviceDurationWithBuffer,
          currentTimeMs,
        ),
        groupedTimeSlots: [],
        serviceId: secondServiceResult.serviceId,
        serviceDuration: secondServiceResult.serviceDuration,
      };
    })(),
  ]);

  // ✅ Pure function: Calculate available time slots for two services
  const twoServicesResult = calculateAvailableTimeSlotsForTwoServices(
    firstServiceBlockingData,
    secondServiceBlockingData,
  );

  // Convert to old format for backward compatibility
  return twoServicesResult.map(dayResult => ({
    day: dayResult.day,
    availableTimeslots: dayResult.availableTimeslots,
  }));
};

export { getGroupedTimeSlots };
