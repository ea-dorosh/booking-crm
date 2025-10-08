/**
 * Adapter functions for integrating pure calendar utilities with existing service
 *
 * These adapters bridge between the existing calendarService API and the new pure functions.
 * They handle:
 * 1. Getting current time (side effect) at the boundary
 * 2. Converting between old and new data structures
 * 3. Maintaining backward compatibility
 *
 * The adapters allow gradual migration from old to new functions.
 */

import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { AppointmentDataType } from '@/@types/appointmentsTypes.js';
import { GroupedAvailabilityDayType } from '@/@types/employeesTypes.js';
import { EmployeeBlockedTimeData } from '@/services/employees/employeesBlockedTimesService.js';
import {
  // Pure functions
  normalizeAppointment,
  filterAppointmentsByDate,
  combineDateTimeInTimezone,
  formatToISODate,
  getStartOfWeek,
  getEndOfWeek,
  getDayOfWeek,
  isDateTodayOrFuture,
  generateDateRange,
  createPauseTime,
  calculateDayAvailability,
  generateEmployeeTimeSlots,
  groupTimeSlotsByStartTime,
  // Types
  NormalizedAppointmentPure,
  WorkingDayPure,
  EmployeeWorkingDayPure,
  DayAvailabilityPure,
  EmployeeWithTimeSlotsPure,
  GroupedTimeSlotPure,
} from './calendarUtils.pure.js';

// Re-export types for convenience
export type {
  NormalizedAppointmentPure,
  WorkingDayPure,
  EmployeeWorkingDayPure,
  DayAvailabilityPure,
  EmployeeWithTimeSlotsPure,
  GroupedTimeSlotPure,
};

const TIMEZONE = `Europe/Berlin`;

// ============================================================================
// ADAPTER FUNCTIONS - Normalization
// ============================================================================

/**
 * Normalize saved appointments (adapter for existing API)
 * Injects current time at the boundary
 */
export const normalizeSavedAppointments = (
  savedAppointments: AppointmentDataType[],
): NormalizedAppointmentPure[] => {
  return savedAppointments.map(appointment =>
    normalizeAppointment(
      appointment.date,
      appointment.timeStart,
      appointment.timeEnd,
      appointment.employee.id,
    ),
  );
};

/**
 * Normalize Google Calendar events (adapter for existing API)
 */
export const normalizeGoogleCalendarEvents = (
  googleEvents: { start: string; end: string; summary: string }[],
  employeeId: number,
): NormalizedAppointmentPure[] => {
  return googleEvents.map(event =>
    normalizeAppointment(
      dayjs(event.start).format(`YYYY-MM-DD`),
      event.start,
      event.end,
      employeeId,
    ),
  );
};

/**
 * Normalize Google Calendar events for employees
 * Filters events by dates that employees work
 */
export const normalizeGoogleEventsForEmployees = (
  googleCalendarEvents: { start: string; end: string; summary: string }[],
  periodWithDaysAndEmployeeAvailability: WorkingDayPure[],
): NormalizedAppointmentPure[] => {
  const normalizedGoogleEvents: NormalizedAppointmentPure[] = [];

  if (periodWithDaysAndEmployeeAvailability.length === 0) {
    return normalizedGoogleEvents;
  }

  // Create employee dates map
  const employeeDatesMap = new Map<number, string[]>();
  periodWithDaysAndEmployeeAvailability.forEach((dayData) => {
    dayData.employees.forEach((employee) => {
      if (!employeeDatesMap.has(employee.employeeId)) {
        employeeDatesMap.set(employee.employeeId, []);
      }
      employeeDatesMap.get(employee.employeeId)!.push(dayData.dateISO);
    });
  });

  // Normalize events for each employee
  for (const [employeeId, dates] of employeeDatesMap) {
    const employeeGoogleEvents = googleCalendarEvents.filter(event => {
      const eventDate = dayjs(event.start).format(`YYYY-MM-DD`);
      return dates.includes(eventDate);
    });

    if (employeeGoogleEvents.length > 0) {
      const normalizedEvents = normalizeGoogleCalendarEvents(employeeGoogleEvents, employeeId);
      normalizedGoogleEvents.push(...normalizedEvents);
    }
  }

  return normalizedGoogleEvents;
};

/**
 * Normalize pause times for employees
 */
export const normalizePauseTimesForEmployees = (
  periodWithDaysAndEmployeeAvailability: WorkingDayPure[],
): NormalizedAppointmentPure[] => {
  const normalizedPauseTimes: NormalizedAppointmentPure[] = [];

  for (const dayData of periodWithDaysAndEmployeeAvailability) {
    for (const employee of dayData.employees) {
      if (!employee.pauseTimes || employee.pauseTimes.length === 0) continue;

      for (const pause of employee.pauseTimes) {
        normalizedPauseTimes.push({
          dateISO: dayData.dateISO,
          startTimeMs: pause.startPauseTimeMs,
          endTimeMs: pause.endPauseTimeMs,
          employeeId: employee.employeeId,
        });
      }
    }
  }

  return normalizedPauseTimes;
};

/**
 * Normalize blocked times for employees
 */
export const normalizeBlockedTimesForEmployees = (
  blockedTimesFromDB: EmployeeBlockedTimeData[],
  periodWithDaysAndEmployeeAvailability: WorkingDayPure[],
): NormalizedAppointmentPure[] => {
  const normalizedBlockedTimes: NormalizedAppointmentPure[] = [];

  for (const blockedTime of blockedTimesFromDB) {
    const blockedDateStr = dayjs(blockedTime.blockedDate).format(`YYYY-MM-DD`);

    if (blockedTime.isAllDay) {
      // Find working hours for this employee on this day
      const dayData = periodWithDaysAndEmployeeAvailability.find(
        (day) => day.dateISO === blockedDateStr,
      );

      if (!dayData) continue;

      const employee = dayData.employees.find(
        (emp) => emp.employeeId === blockedTime.employeeId,
      );

      if (!employee) continue;

      // Block entire working day
      normalizedBlockedTimes.push({
        dateISO: blockedDateStr as Date_ISO_Type,
        startTimeMs: employee.startWorkingTimeMs,
        endTimeMs: employee.endWorkingTimeMs,
        employeeId: blockedTime.employeeId,
      });
    } else {
      // Block specific time range
      if (!blockedTime.startTime || !blockedTime.endTime) continue;

      const startDateTime = combineDateTimeInTimezone(
        blockedDateStr as Date_ISO_Type,
        blockedTime.startTime as Time_HH_MM_SS_Type,
        TIMEZONE,
      );

      const endDateTime = combineDateTimeInTimezone(
        blockedDateStr as Date_ISO_Type,
        blockedTime.endTime as Time_HH_MM_SS_Type,
        TIMEZONE,
      );

      normalizedBlockedTimes.push({
        dateISO: blockedDateStr as Date_ISO_Type,
        startTimeMs: startDateTime,
        endTimeMs: endDateTime,
        employeeId: blockedTime.employeeId,
      });
    }
  }

  return normalizedBlockedTimes;
};

// ============================================================================
// ADAPTER FUNCTIONS - Period Generation
// ============================================================================

/**
 * Get period with days and employee availability (adapter)
 * Injects current time at the boundary
 */
export const getPeriodWithDaysAndEmployeeAvailabilityPure = (
  initialParamDate: Date_ISO_Type,
  groupedEmployeeAvailability: GroupedAvailabilityDayType[],
  currentTimeMs?: number, // Optional for testing, defaults to now
): WorkingDayPure[] => {
  const now = currentTimeMs ?? dayjs().utc().valueOf();

  const initialParamDateMs = dayjs.utc(initialParamDate).valueOf();
  const firstDayInPeriodMs = getStartOfWeek(initialParamDateMs);
  const lastDayInPeriodMs = getEndOfWeek(initialParamDateMs);

  const datesInPeriod = generateDateRange(firstDayInPeriodMs, lastDayInPeriodMs);

  const period: WorkingDayPure[] = [];

  for (const dateMs of datesInPeriod) {
    // Only include today and future dates
    if (!isDateTodayOrFuture(dateMs, now)) {
      continue;
    }

    const dateISO = formatToISODate(dateMs);
    const dayOfWeek = getDayOfWeek(dateMs);

    const dayAvailability = groupedEmployeeAvailability.find(
      availability => availability.dayId === dayOfWeek,
    );

    if (dayAvailability) {
      const employees: EmployeeWorkingDayPure[] = dayAvailability.employees.map(employee => {
        const pauseTimes = [];

        if (employee.blockStartTimeFirst && employee.blockEndTimeFirst) {
          pauseTimes.push(
            createPauseTime(
              dateISO,
              employee.blockStartTimeFirst as Time_HH_MM_SS_Type,
              employee.blockEndTimeFirst as Time_HH_MM_SS_Type,
              TIMEZONE,
            ),
          );
        }

        return {
          employeeId: employee.id,
          startWorkingTimeMs: combineDateTimeInTimezone(
            dateISO,
            employee.startTime as Time_HH_MM_SS_Type,
            TIMEZONE,
          ),
          endWorkingTimeMs: combineDateTimeInTimezone(
            dateISO,
            employee.endTime as Time_HH_MM_SS_Type,
            TIMEZONE,
          ),
          pauseTimes,
          advanceBookingTime: employee.advanceBookingTime,
          timeslotInterval: parseInt(employee.timeslotInterval, 10),
        };
      });

      period.push({
        dateISO,
        employees,
      });
    }
  }

  return period;
};

// ============================================================================
// ADAPTER FUNCTIONS - Complete Processing Pipeline
// ============================================================================

/**
 * Process period with availability calculation (adapter)
 * This is the main entry point that processes a full period
 */
export const processPeriodAvailability = (
  period: WorkingDayPure[],
  normalizedAppointments: NormalizedAppointmentPure[],
  serviceDuration: Time_HH_MM_SS_Type,
  currentTimeMs?: number, // Optional for testing
): DayAvailabilityPure[] => {
  const now = currentTimeMs ?? dayjs().utc().valueOf();
  const todayDateISO = formatToISODate(now);

  return period.map(workingDay => {
    const dayAppointments = filterAppointmentsByDate(normalizedAppointments, workingDay.dateISO);

    return calculateDayAvailability(
      workingDay,
      dayAppointments,
      now,
      todayDateISO,
      serviceDuration,
    );
  });
};

/**
 * Generate time slots from day availability (adapter)
 */
export const generateTimeSlotsFromDayAvailability = (
  dayAvailability: DayAvailabilityPure[],
  currentTimeMs?: number, // Optional current time for filtering
): EmployeeWithTimeSlotsPure[][] => {
  return dayAvailability.map(day => {
    // Only filter by current time for today's date
    const dayDateMs = dayjs.utc(day.dateISO).valueOf();
    const todayStartMs = dayjs().utc().startOf(`day`).valueOf();
    const todayEndMs = dayjs().utc().endOf(`day`).valueOf();
    
    // If this is today's date, filter by current time
    // If this is a future date, don't filter by current time
    const shouldFilterByTime = dayDateMs >= todayStartMs && dayDateMs <= todayEndMs;
    const filterTime = shouldFilterByTime ? currentTimeMs : undefined;
    
    return day.employees.map(employee => ({
      employeeId: employee.employeeId,
      timeSlots: generateEmployeeTimeSlots(
        employee.availableTimes,
        employee.timeslotInterval,
        filterTime, // Only filter for today
      ),
    }));
  });
};

/**
 * Group time slots by start time (adapter)
 */
export const groupTimeSlotsForPeriod = (
  employeeTimeSlotsPerDay: EmployeeWithTimeSlotsPure[][],
  timezone: string = TIMEZONE,
): GroupedTimeSlotPure[][] => {
  return employeeTimeSlotsPerDay.map(employeesForDay =>
    [groupTimeSlotsByStartTime(employeesForDay, timezone)],
  ).flat();
};

// ============================================================================
// CONVENIENCE FUNCTIONS - Full Pipeline
// ============================================================================

/**
 * Full pipeline: from employee availability to grouped time slots
 * This adapter provides a simple API for the service layer
 */
export const calculateAvailableTimeSlots = (
  initialParamDate: Date_ISO_Type,
  groupedEmployeeAvailability: GroupedAvailabilityDayType[],
  savedAppointments: AppointmentDataType[],
  blockedTimesFromDB: EmployeeBlockedTimeData[],
  googleCalendarEvents: { start: string; end: string; summary: string }[],
  serviceDuration: Time_HH_MM_SS_Type,
  currentTimeMs?: number, // Optional for testing
): {
  period: WorkingDayPure[];
  dayAvailability: DayAvailabilityPure[];
  groupedTimeSlots: GroupedTimeSlotPure[][];
} => {
  // Get current time at the boundary (or use provided for testing)
  const now = currentTimeMs ?? dayjs().utc().valueOf();

  // Generate period with employee working times
  const period = getPeriodWithDaysAndEmployeeAvailabilityPure(
    initialParamDate,
    groupedEmployeeAvailability,
    now,
  );

  // Normalize all blocking sources
  const normalizedSavedAppointments = normalizeSavedAppointments(savedAppointments);
  const normalizedGoogleEvents = normalizeGoogleEventsForEmployees(googleCalendarEvents, period);
  const normalizedPauseTimes = normalizePauseTimesForEmployees(period);
  const normalizedBlockedTimes = normalizeBlockedTimesForEmployees(blockedTimesFromDB, period);

  // Combine all appointments
  const allNormalizedAppointments = [
    ...normalizedSavedAppointments,
    ...normalizedGoogleEvents,
    ...normalizedPauseTimes,
    ...normalizedBlockedTimes,
  ];

  // Calculate availability
  const dayAvailability = processPeriodAvailability(
    period,
    allNormalizedAppointments,
    serviceDuration,
    now,
  );

  // Generate time slots
  const employeeTimeSlotsPerDay = generateTimeSlotsFromDayAvailability(dayAvailability);

  // Group time slots
  const groupedTimeSlots = groupTimeSlotsForPeriod(employeeTimeSlotsPerDay);

  return {
    period,
    dayAvailability,
    groupedTimeSlots,
  };
};

