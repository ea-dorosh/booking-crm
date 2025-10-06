/**
 * Pure utility functions for calendar calculations
 *
 * Design principles:
 * 1. All functions are pure - no side effects, same input = same output
 * 2. No direct usage of dayjs() without parameters (current time must be passed explicitly)
 * 3. Work with primitives (timestamps, ISO strings) where possible
 * 4. Timezone conversions are explicit and predictable
 * 5. Each function has a single responsibility
 */

import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

// ============================================================================
// PURE HELPER FUNCTIONS - Date/Time Calculations
// ============================================================================

/**
 * Parse time duration string to milliseconds
 * @param duration - time duration in HH:mm:ss format
 * @returns duration in milliseconds
 */
export const parseDurationToMilliseconds = (duration: Time_HH_MM_SS_Type): number => {
  const [hours, minutes, seconds] = duration.split(`:`).map(Number);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
};

/**
 * Subtract duration from timestamp
 * @param timestampMs - base timestamp in milliseconds
 * @param durationMs - duration to subtract in milliseconds
 * @returns new timestamp in milliseconds
 */
export const subtractDuration = (timestampMs: number, durationMs: number): number => {
  return timestampMs - durationMs;
};

/**
 * Add duration to timestamp
 * @param timestampMs - base timestamp in milliseconds
 * @param durationMs - duration to add in milliseconds
 * @returns new timestamp in milliseconds
 */
export const addDuration = (timestampMs: number, durationMs: number): number => {
  return timestampMs + durationMs;
};

/**
 * Calculate adjusted end time by subtracting service duration from a given time
 * Pure version - works with timestamps instead of Dayjs objects
 *
 * @param baseTimeMs - base time in milliseconds (UTC)
 * @param serviceDuration - service duration in HH:mm:ss format
 * @returns adjusted time in milliseconds (UTC)
 */
export const calculateAdjustedEndTimeMs = (
  baseTimeMs: number,
  serviceDuration: Time_HH_MM_SS_Type,
): number => {
  const durationMs = parseDurationToMilliseconds(serviceDuration);
  return subtractDuration(baseTimeMs, durationMs);
};

/**
 * Calculate appointment end time by adding service duration to start time
 * Pure version - works with timestamps instead of Dayjs objects
 *
 * @param startTimeMs - appointment start time in milliseconds (UTC)
 * @param serviceDuration - service duration in HH:mm:ss format
 * @returns end time in milliseconds (UTC)
 */
export const calculateAppointmentEndTimeMs = (
  startTimeMs: number,
  serviceDuration: Time_HH_MM_SS_Type,
): number => {
  const durationMs = parseDurationToMilliseconds(serviceDuration);
  return addDuration(startTimeMs, durationMs);
};

// ============================================================================
// TYPES FOR PURE FUNCTIONS
// ============================================================================

export interface BlockedTimePure {
  startBlockedTimeMs: number; // UTC timestamp in milliseconds
  endBlockedTimeMs: number; // UTC timestamp in milliseconds
}

export interface AvailableTimePure {
  minPossibleStartTimeMs: number; // UTC timestamp in milliseconds
  maxPossibleStartTimeMs: number; // UTC timestamp in milliseconds
}

// ============================================================================
// PURE BUSINESS LOGIC - Available Times Calculation
// ============================================================================

/**
 * Sort blocked times by start time
 * Pure function - returns new sorted array
 */
export const sortBlockedTimes = (blockedTimes: BlockedTimePure[]): BlockedTimePure[] => {
  return [...blockedTimes].sort((a, b) => a.startBlockedTimeMs - b.startBlockedTimeMs);
};

/**
 * Calculate available time slots between blocked periods
 * Pure version - works with timestamps
 *
 * @param startWorkingTimeMs - start of working hours in milliseconds (UTC)
 * @param endWorkingTimeMs - end of working hours in milliseconds (UTC)
 * @param blockedTimes - array of blocked time periods
 * @param serviceDuration - service duration in HH:mm:ss format
 * @returns array of available time slots
 */
export const calculateAvailableTimesMs = (
  startWorkingTimeMs: number,
  endWorkingTimeMs: number,
  blockedTimes: BlockedTimePure[],
  serviceDuration: Time_HH_MM_SS_Type,
): AvailableTimePure[] => {
  const availableTimes: AvailableTimePure[] = [];

  // If no blocked times, the entire working period is potentially available
  if (blockedTimes.length === 0) {
    const adjustedEndTimeMs = calculateAdjustedEndTimeMs(endWorkingTimeMs, serviceDuration);

    if (adjustedEndTimeMs > startWorkingTimeMs) {
      return [{
        minPossibleStartTimeMs: startWorkingTimeMs,
        maxPossibleStartTimeMs: adjustedEndTimeMs,
      }];
    }
    return [];
  }

  const sortedBlockedTimes = sortBlockedTimes(blockedTimes);
  let currentTimeMs = startWorkingTimeMs;

  // Find available slots between blocked times
  for (const blockedTime of sortedBlockedTimes) {
    if (blockedTime.startBlockedTimeMs > currentTimeMs) {
      const adjustedEndTimeMs = calculateAdjustedEndTimeMs(blockedTime.startBlockedTimeMs, serviceDuration);

      if (adjustedEndTimeMs >= currentTimeMs) {
        availableTimes.push({
          minPossibleStartTimeMs: currentTimeMs,
          maxPossibleStartTimeMs: adjustedEndTimeMs,
        });
      }
    }

    // Move currentTime forward, never backward - handles overlapping blocked periods
    currentTimeMs = Math.max(currentTimeMs, blockedTime.endBlockedTimeMs);
  }

  // Check if there's available time after the last blocked period
  if (currentTimeMs < endWorkingTimeMs) {
    const adjustedEndTimeMs = calculateAdjustedEndTimeMs(endWorkingTimeMs, serviceDuration);

    if (adjustedEndTimeMs >= currentTimeMs) {
      availableTimes.push({
        minPossibleStartTimeMs: currentTimeMs,
        maxPossibleStartTimeMs: adjustedEndTimeMs,
      });
    }
  }

  return availableTimes;
};

// ============================================================================
// PURE HELPER FUNCTIONS - Time Rounding
// ============================================================================

/**
 * Round minutes up to the nearest 15-minute interval
 * Pure function - simple math
 *
 * @param minutes - minutes to round (0-59)
 * @returns rounded minutes (0, 15, 30, 45, or 60)
 */
export const roundUpToFifteenMinutes = (minutes: number): number => {
  return Math.ceil(minutes / 15) * 15;
};

/**
 * Round timestamp up to next 15-minute interval
 * Pure version - works with timestamps
 *
 * @param timestampMs - timestamp in milliseconds
 * @returns rounded timestamp in milliseconds
 */
export const roundTimestampToFifteenMinutes = (timestampMs: number): number => {
  const date = dayjs(timestampMs).utc();
  const currentMinutes = date.minute();
  const currentSeconds = date.second();
  const currentMilliseconds = date.millisecond();

  // If already at exact 15-minute boundary with no seconds/ms, return as is
  if (currentMinutes % 15 === 0 && currentSeconds === 0 && currentMilliseconds === 0) {
    return timestampMs;
  }

  // If we have seconds or milliseconds, we need to round up even if minutes are on boundary
  let roundedMinutes: number;
  if (currentMinutes % 15 === 0 && (currentSeconds > 0 || currentMilliseconds > 0)) {
    // On minute boundary but has seconds/ms - round to next boundary
    roundedMinutes = currentMinutes + 15;
  } else {
    roundedMinutes = roundUpToFifteenMinutes(currentMinutes);
  }

  let result = date
    .minute(roundedMinutes % 60)
    .second(0)
    .millisecond(0);

  // Handle hour overflow
  if (roundedMinutes >= 60) {
    result = result.add(1, `hour`).minute(0);
  }

  return result.valueOf();
};

// ============================================================================
// PURE HELPER FUNCTIONS - Date Calculations
// ============================================================================

/**
 * Get the start of week for a given date
 * Pure function - deterministic date calculation
 *
 * @param dateMs - date timestamp in milliseconds
 * @returns start of week timestamp in milliseconds (UTC, 00:00:00)
 */
export const getStartOfWeek = (dateMs: number): number => {
  return dayjs(dateMs).utc().startOf(`week`).valueOf();
};

/**
 * Get the end of week for a given date
 * Pure function - deterministic date calculation
 *
 * @param dateMs - date timestamp in milliseconds
 * @returns end of week timestamp in milliseconds (UTC, 23:59:59.999)
 */
export const getEndOfWeek = (dateMs: number): number => {
  return dayjs(dateMs).utc().endOf(`week`).valueOf();
};

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 * Pure function - deterministic
 *
 * @param dateMs - date timestamp in milliseconds
 * @returns day of week number (0-6)
 */
export const getDayOfWeek = (dateMs: number): number => {
  return dayjs(dateMs).utc().day();
};

/**
 * Format timestamp to ISO date string (YYYY-MM-DD)
 * Pure function - deterministic formatting
 *
 * @param timestampMs - timestamp in milliseconds (UTC)
 * @returns ISO date string
 */
export const formatToISODate = (timestampMs: number): Date_ISO_Type => {
  return dayjs(timestampMs).utc().format(DATE_FORMAT) as Date_ISO_Type;
};

/**
 * Parse ISO date string to timestamp at start of day (UTC)
 * Pure function - deterministic parsing
 *
 * @param dateISO - ISO date string (YYYY-MM-DD)
 * @returns timestamp in milliseconds at 00:00:00 UTC
 */
export const parseISODateToTimestamp = (dateISO: Date_ISO_Type): number => {
  return dayjs.utc(dateISO).valueOf();
};

/**
 * Combine date and time in specific timezone and convert to UTC timestamp
 * Pure function - deterministic timezone conversion
 *
 * @param dateISO - date in YYYY-MM-DD format
 * @param timeHMS - time in HH:mm:ss format
 * @param timezone - IANA timezone string (e.g., 'Europe/Berlin')
 * @returns UTC timestamp in milliseconds
 */
export const combineDateTimeInTimezone = (
  dateISO: Date_ISO_Type,
  timeHMS: Time_HH_MM_SS_Type,
  timezone: string,
): number => {
  return dayjs.tz(`${dateISO} ${timeHMS}`, timezone).utc().valueOf();
};

/**
 * Convert UTC timestamp to time string in specific timezone
 * Pure function - deterministic conversion
 *
 * @param timestampMs - UTC timestamp in milliseconds
 * @param timezone - IANA timezone string (e.g., 'Europe/Berlin')
 * @returns time string in HH:mm:ss format
 */
export const formatTimestampToTimeInTimezone = (
  timestampMs: number,
  timezone: string,
): Time_HH_MM_SS_Type => {
  return dayjs(timestampMs).tz(timezone).format(TIME_FORMAT) as Time_HH_MM_SS_Type;
};

/**
 * Check if timestamp is on or after another timestamp
 * Pure function - simple comparison
 *
 * @param timestampMs - timestamp to check
 * @param referenceMs - reference timestamp
 * @returns true if timestamp is same or after reference
 */
export const isTimestampSameOrAfter = (timestampMs: number, referenceMs: number): boolean => {
  return timestampMs >= referenceMs;
};

/**
 * Check if timestamp is before another timestamp
 * Pure function - simple comparison
 *
 * @param timestampMs - timestamp to check
 * @param referenceMs - reference timestamp
 * @returns true if timestamp is before reference
 */
export const isTimestampBefore = (timestampMs: number, referenceMs: number): boolean => {
  return timestampMs < referenceMs;
};

/**
 * Get start of day for a timestamp
 * Pure function - deterministic
 * 
 * @param timestampMs - timestamp in milliseconds
 * @returns timestamp at start of day (00:00:00) in UTC
 */
export const getStartOfDay = (timestampMs: number): number => {
  return dayjs(timestampMs).utc().startOf(`day`).valueOf();
};

// ============================================================================
// PURE FUNCTIONS - Normalization
// ============================================================================

export interface NormalizedAppointmentPure {
  dateISO: Date_ISO_Type;
  startTimeMs: number; // UTC timestamp
  endTimeMs: number; // UTC timestamp
  employeeId: number;
}

/**
 * Normalize appointment data to standard format
 * Pure function - simple data transformation
 * 
 * @param date - date in YYYY-MM-DD format
 * @param timeStart - start time as ISO string or timestamp
 * @param timeEnd - end time as ISO string or timestamp
 * @param employeeId - employee ID
 * @returns normalized appointment
 */
export const normalizeAppointment = (
  date: string,
  timeStart: string,
  timeEnd: string,
  employeeId: number,
): NormalizedAppointmentPure => {
  return {
    dateISO: date as Date_ISO_Type,
    startTimeMs: dayjs(timeStart).utc().valueOf(),
    endTimeMs: dayjs(timeEnd).utc().valueOf(),
    employeeId,
  };
};

/**
 * Filter appointments by date
 * Pure function - simple array filtering
 * 
 * @param appointments - array of normalized appointments
 * @param dateISO - date to filter by
 * @returns filtered appointments
 */
export const filterAppointmentsByDate = (
  appointments: NormalizedAppointmentPure[],
  dateISO: Date_ISO_Type,
): NormalizedAppointmentPure[] => {
  return appointments.filter(appointment => appointment.dateISO === dateISO);
};

/**
 * Filter appointments by employee
 * Pure function - simple array filtering
 * 
 * @param appointments - array of normalized appointments
 * @param employeeId - employee ID to filter by
 * @returns filtered appointments
 */
export const filterAppointmentsByEmployee = (
  appointments: NormalizedAppointmentPure[],
  employeeId: number,
): NormalizedAppointmentPure[] => {
  return appointments.filter(appointment => appointment.employeeId === employeeId);
};

/**
 * Convert normalized appointments to blocked times
 * Pure function - simple data transformation
 * 
 * @param appointments - array of normalized appointments
 * @returns array of blocked times
 */
export const appointmentsToBlockedTimes = (
  appointments: NormalizedAppointmentPure[],
): BlockedTimePure[] => {
  return appointments.map(appointment => ({
    startBlockedTimeMs: appointment.startTimeMs,
    endBlockedTimeMs: appointment.endTimeMs,
  }));
};

// ============================================================================
// PURE FUNCTIONS - Advance Booking Time Calculation
// ============================================================================

/**
 * Parse advance booking time string to milliseconds
 * Pure function - string parsing
 * 
 * @param advanceBookingTime - time in HH:MM:SS format or 'next_day'
 * @returns duration in milliseconds or special value for next_day
 */
export const parseAdvanceBookingTime = (advanceBookingTime: string): number | `next_day` => {
  if (advanceBookingTime === `next_day`) {
    return `next_day`;
  }
  
  const [hours, minutes, seconds] = advanceBookingTime.split(`:`).map(Number);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
};

/**
 * Calculate blocked time for advance booking
 * Pure function - deterministic calculation
 * 
 * @param currentTimeMs - current timestamp in milliseconds (UTC)
 * @param advanceBookingTime - advance booking time (ms or 'next_day')
 * @param startWorkingTimeMs - start of working hours in milliseconds (UTC)
 * @param endWorkingTimeMs - end of working hours in milliseconds (UTC)
 * @param todayDateISO - today's date in YYYY-MM-DD format
 * @param workingDayDateISO - working day's date in YYYY-MM-DD format
 * @returns blocked time or null if no blocking needed
 */
export const calculateAdvanceBookingBlockedTime = (
  currentTimeMs: number,
  advanceBookingTime: number | `next_day`,
  startWorkingTimeMs: number,
  endWorkingTimeMs: number,
  todayDateISO: Date_ISO_Type,
  workingDayDateISO: Date_ISO_Type,
): BlockedTimePure | null => {
  // Only apply advance booking blocking for today
  if (todayDateISO !== workingDayDateISO) {
    return null;
  }

  if (advanceBookingTime === `next_day`) {
    // Block entire working day
    return {
      startBlockedTimeMs: startWorkingTimeMs,
      endBlockedTimeMs: endWorkingTimeMs,
    };
  }

  // Calculate time when booking becomes available
  const bookingAvailableFromMs = currentTimeMs + advanceBookingTime;

  // Only block if booking time is within or after working hours
  if (bookingAvailableFromMs > startWorkingTimeMs && bookingAvailableFromMs < endWorkingTimeMs) {
    return {
      startBlockedTimeMs: startWorkingTimeMs,
      endBlockedTimeMs: bookingAvailableFromMs,
    };
  }

  if (bookingAvailableFromMs >= endWorkingTimeMs) {
    // Block entire day
    return {
      startBlockedTimeMs: startWorkingTimeMs,
      endBlockedTimeMs: endWorkingTimeMs,
    };
  }

  return null;
};

// ============================================================================
// PURE FUNCTIONS - Period Generation
// ============================================================================

/**
 * Generate array of dates between start and end (inclusive)
 * Pure function - deterministic date generation
 * 
 * @param startDateMs - start date timestamp
 * @param endDateMs - end date timestamp
 * @returns array of date timestamps (all at 00:00:00 UTC)
 */
export const generateDateRange = (startDateMs: number, endDateMs: number): number[] => {
  const dates: number[] = [];
  let currentDateMs = getStartOfDay(startDateMs);
  const endDateStartMs = getStartOfDay(endDateMs);

  while (currentDateMs <= endDateStartMs) {
    dates.push(currentDateMs);
    currentDateMs = dayjs(currentDateMs).add(1, `day`).valueOf();
  }

  return dates;
};

/**
 * Check if date is today or in the future
 * Pure function - simple comparison
 * 
 * @param dateMs - date timestamp to check
 * @param todayMs - today's date timestamp
 * @returns true if date is today or later
 */
export const isDateTodayOrFuture = (dateMs: number, todayMs: number): boolean => {
  const dateStartOfDay = getStartOfDay(dateMs);
  const todayStartOfDay = getStartOfDay(todayMs);
  return dateStartOfDay >= todayStartOfDay;
};

