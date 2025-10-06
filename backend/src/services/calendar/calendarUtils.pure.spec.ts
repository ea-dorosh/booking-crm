/**
 * Tests for pure calendar utility functions
 *
 * These tests demonstrate that all functions are pure:
 * - Same input always produces same output
 * - No side effects
 * - Predictable and deterministic
 */

import { describe, expect, it } from '@jest/globals';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import {
  parseDurationToMilliseconds,
  subtractDuration,
  addDuration,
  calculateAdjustedEndTimeMs,
  calculateAppointmentEndTimeMs,
  sortBlockedTimes,
  calculateAvailableTimesMs,
  roundUpToFifteenMinutes,
  roundTimestampToFifteenMinutes,
  getStartOfWeek,
  getEndOfWeek,
  getDayOfWeek,
  formatToISODate,
  parseISODateToTimestamp,
  combineDateTimeInTimezone,
  formatTimestampToTimeInTimezone,
  isTimestampSameOrAfter,
  isTimestampBefore,
  getStartOfDay,
  BlockedTimePure,
} from '@/services/calendar/calendarUtils.pure.js';
import { Time_HH_MM_SS_Type, Date_ISO_Type } from '@/@types/utilTypes.js';

describe(`calendarUtils.pure`, () => {

  // ============================================================================
  // Duration Parsing and Arithmetic
  // ============================================================================

  describe(`parseDurationToMilliseconds`, () => {
    it(`should parse 1 hour correctly`, () => {
      const result = parseDurationToMilliseconds(`01:00:00` as Time_HH_MM_SS_Type);
      expect(result).toBe(3600000); // 1 hour = 3600000ms
    });

    it(`should parse 30 minutes correctly`, () => {
      const result = parseDurationToMilliseconds(`00:30:00` as Time_HH_MM_SS_Type);
      expect(result).toBe(1800000); // 30 min = 1800000ms
    });

    it(`should parse complex duration correctly`, () => {
      const result = parseDurationToMilliseconds(`02:15:30` as Time_HH_MM_SS_Type);
      expect(result).toBe(8130000); // 2h 15m 30s = 8130000ms
    });

    it(`should handle zero duration`, () => {
      const result = parseDurationToMilliseconds(`00:00:00` as Time_HH_MM_SS_Type);
      expect(result).toBe(0);
    });
  });

  describe(`subtractDuration`, () => {
    it(`should subtract duration from timestamp`, () => {
      const baseTime = 10000000;
      const duration = 1000;
      const result = subtractDuration(baseTime, duration);
      expect(result).toBe(9999000);
    });
  });

  describe(`addDuration`, () => {
    it(`should add duration to timestamp`, () => {
      const baseTime = 10000000;
      const duration = 1000;
      const result = addDuration(baseTime, duration);
      expect(result).toBe(10001000);
    });
  });

  // ============================================================================
  // Adjusted End Time Calculation
  // ============================================================================

  describe(`calculateAdjustedEndTimeMs`, () => {
    it(`should subtract 1 hour service duration from end time`, () => {
      // 2024-01-15 10:00:00 UTC
      const baseTimeMs = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const serviceDuration = `01:00:00` as Time_HH_MM_SS_Type;

      const result = calculateAdjustedEndTimeMs(baseTimeMs, serviceDuration);

      // Should be 2024-01-15 09:00:00 UTC
      const expected = dayjs.utc(`2024-01-15 09:00:00`).valueOf();
      expect(result).toBe(expected);
    });

    it(`should subtract 30 minutes service duration from end time`, () => {
      const baseTimeMs = dayjs.utc(`2024-01-15 14:00:00`).valueOf();
      const serviceDuration = `00:30:00` as Time_HH_MM_SS_Type;

      const result = calculateAdjustedEndTimeMs(baseTimeMs, serviceDuration);

      const expected = dayjs.utc(`2024-01-15 13:30:00`).valueOf();
      expect(result).toBe(expected);
    });

    it(`should be pure - same input produces same output`, () => {
      const baseTimeMs = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const serviceDuration = `01:00:00` as Time_HH_MM_SS_Type;

      const result1 = calculateAdjustedEndTimeMs(baseTimeMs, serviceDuration);
      const result2 = calculateAdjustedEndTimeMs(baseTimeMs, serviceDuration);

      expect(result1).toBe(result2);
    });
  });

  // ============================================================================
  // Appointment End Time Calculation
  // ============================================================================

  describe(`calculateAppointmentEndTimeMs`, () => {
    it(`should add 1 hour service duration to start time`, () => {
      const startTimeMs = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const serviceDuration = `01:00:00` as Time_HH_MM_SS_Type;

      const result = calculateAppointmentEndTimeMs(startTimeMs, serviceDuration);

      const expected = dayjs.utc(`2024-01-15 11:00:00`).valueOf();
      expect(result).toBe(expected);
    });

    it(`should add 45 minutes service duration to start time`, () => {
      const startTimeMs = dayjs.utc(`2024-01-15 10:15:00`).valueOf();
      const serviceDuration = `00:45:00` as Time_HH_MM_SS_Type;

      const result = calculateAppointmentEndTimeMs(startTimeMs, serviceDuration);

      const expected = dayjs.utc(`2024-01-15 11:00:00`).valueOf();
      expect(result).toBe(expected);
    });

    it(`should be pure - same input produces same output`, () => {
      const startTimeMs = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const serviceDuration = `01:00:00` as Time_HH_MM_SS_Type;

      const result1 = calculateAppointmentEndTimeMs(startTimeMs, serviceDuration);
      const result2 = calculateAppointmentEndTimeMs(startTimeMs, serviceDuration);

      expect(result1).toBe(result2);
    });
  });

  // ============================================================================
  // Blocked Times Sorting
  // ============================================================================

  describe(`sortBlockedTimes`, () => {
    it(`should sort blocked times by start time`, () => {
      const blockedTimes: BlockedTimePure[] = [
        {
          startBlockedTimeMs: 3000,
          endBlockedTimeMs: 4000,
        },
        {
          startBlockedTimeMs: 1000,
          endBlockedTimeMs: 2000,
        },
        {
          startBlockedTimeMs: 2000,
          endBlockedTimeMs: 3000,
        },
      ];

      const result = sortBlockedTimes(blockedTimes);

      expect(result[0].startBlockedTimeMs).toBe(1000);
      expect(result[1].startBlockedTimeMs).toBe(2000);
      expect(result[2].startBlockedTimeMs).toBe(3000);
    });

    it(`should not mutate original array`, () => {
      const blockedTimes: BlockedTimePure[] = [
        {
          startBlockedTimeMs: 3000,
          endBlockedTimeMs: 4000,
        },
        {
          startBlockedTimeMs: 1000,
          endBlockedTimeMs: 2000,
        },
      ];

      const original = [...blockedTimes];
      sortBlockedTimes(blockedTimes);

      expect(blockedTimes).toEqual(original);
    });
  });

  // ============================================================================
  // Available Times Calculation
  // ============================================================================

  describe(`calculateAvailableTimesMs`, () => {
    it(`should return full working hours when no blocked times`, () => {
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 17:00:00`).valueOf();
      const blockedTimes: BlockedTimePure[] = [];
      const serviceDuration = `01:00:00` as Time_HH_MM_SS_Type;

      const result = calculateAvailableTimesMs(
        startWorkingMs,
        endWorkingMs,
        blockedTimes,
        serviceDuration,
      );

      expect(result).toHaveLength(1);
      expect(result[0].minPossibleStartTimeMs).toBe(startWorkingMs);
      // maxPossibleStartTime should be 17:00 - 01:00 = 16:00
      expect(result[0].maxPossibleStartTimeMs).toBe(dayjs.utc(`2024-01-15 16:00:00`).valueOf());
    });

    it(`should return empty array when service duration is longer than working hours`, () => {
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 09:00:00`).valueOf();
      const blockedTimes: BlockedTimePure[] = [];
      const serviceDuration = `02:00:00` as Time_HH_MM_SS_Type;

      const result = calculateAvailableTimesMs(
        startWorkingMs,
        endWorkingMs,
        blockedTimes,
        serviceDuration,
      );

      expect(result).toHaveLength(0);
    });

    it(`should calculate available times with one blocked period in the middle`, () => {
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 17:00:00`).valueOf();
      const blockedTimes: BlockedTimePure[] = [
        {
          startBlockedTimeMs: dayjs.utc(`2024-01-15 12:00:00`).valueOf(),
          endBlockedTimeMs: dayjs.utc(`2024-01-15 13:00:00`).valueOf(),
        },
      ];
      const serviceDuration = `01:00:00` as Time_HH_MM_SS_Type;

      const result = calculateAvailableTimesMs(
        startWorkingMs,
        endWorkingMs,
        blockedTimes,
        serviceDuration,
      );

      expect(result).toHaveLength(2);

      // First slot: 08:00 - 11:00 (can start service until 11:00)
      expect(result[0].minPossibleStartTimeMs).toBe(startWorkingMs);
      expect(result[0].maxPossibleStartTimeMs).toBe(dayjs.utc(`2024-01-15 11:00:00`).valueOf());

      // Second slot: 13:00 - 16:00 (can start service until 16:00)
      expect(result[1].minPossibleStartTimeMs).toBe(dayjs.utc(`2024-01-15 13:00:00`).valueOf());
      expect(result[1].maxPossibleStartTimeMs).toBe(dayjs.utc(`2024-01-15 16:00:00`).valueOf());
    });

    it(`should handle overlapping blocked times correctly`, () => {
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 17:00:00`).valueOf();
      const blockedTimes: BlockedTimePure[] = [
        {
          startBlockedTimeMs: dayjs.utc(`2024-01-15 10:00:00`).valueOf(),
          endBlockedTimeMs: dayjs.utc(`2024-01-15 12:00:00`).valueOf(),
        },
        {
          startBlockedTimeMs: dayjs.utc(`2024-01-15 11:00:00`).valueOf(),
          endBlockedTimeMs: dayjs.utc(`2024-01-15 13:00:00`).valueOf(),
        },
      ];
      const serviceDuration = `01:00:00` as Time_HH_MM_SS_Type;

      const result = calculateAvailableTimesMs(
        startWorkingMs,
        endWorkingMs,
        blockedTimes,
        serviceDuration,
      );

      expect(result).toHaveLength(2);

      // First slot: 08:00 - 09:00
      expect(result[0].minPossibleStartTimeMs).toBe(startWorkingMs);
      expect(result[0].maxPossibleStartTimeMs).toBe(dayjs.utc(`2024-01-15 09:00:00`).valueOf());

      // Second slot: 13:00 - 16:00 (overlapping blocks merge)
      expect(result[1].minPossibleStartTimeMs).toBe(dayjs.utc(`2024-01-15 13:00:00`).valueOf());
      expect(result[1].maxPossibleStartTimeMs).toBe(dayjs.utc(`2024-01-15 16:00:00`).valueOf());
    });

    it(`should handle multiple non-overlapping blocked times`, () => {
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 17:00:00`).valueOf();
      const blockedTimes: BlockedTimePure[] = [
        {
          startBlockedTimeMs: dayjs.utc(`2024-01-15 09:00:00`).valueOf(),
          endBlockedTimeMs: dayjs.utc(`2024-01-15 10:00:00`).valueOf(),
        },
        {
          startBlockedTimeMs: dayjs.utc(`2024-01-15 12:00:00`).valueOf(),
          endBlockedTimeMs: dayjs.utc(`2024-01-15 13:00:00`).valueOf(),
        },
        {
          startBlockedTimeMs: dayjs.utc(`2024-01-15 15:00:00`).valueOf(),
          endBlockedTimeMs: dayjs.utc(`2024-01-15 16:00:00`).valueOf(),
        },
      ];
      const serviceDuration = `00:30:00` as Time_HH_MM_SS_Type;

      const result = calculateAvailableTimesMs(
        startWorkingMs,
        endWorkingMs,
        blockedTimes,
        serviceDuration,
      );

      expect(result).toHaveLength(4);
    });

    it(`should be pure - same input produces same output`, () => {
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 17:00:00`).valueOf();
      const blockedTimes: BlockedTimePure[] = [
        {
          startBlockedTimeMs: dayjs.utc(`2024-01-15 12:00:00`).valueOf(),
          endBlockedTimeMs: dayjs.utc(`2024-01-15 13:00:00`).valueOf(),
        },
      ];
      const serviceDuration = `01:00:00` as Time_HH_MM_SS_Type;

      const result1 = calculateAvailableTimesMs(
        startWorkingMs,
        endWorkingMs,
        blockedTimes,
        serviceDuration,
      );

      const result2 = calculateAvailableTimesMs(
        startWorkingMs,
        endWorkingMs,
        blockedTimes,
        serviceDuration,
      );

      expect(result1).toEqual(result2);
    });
  });

  // ============================================================================
  // Time Rounding
  // ============================================================================

  describe(`roundUpToFifteenMinutes`, () => {
    it(`should round 0 to 0`, () => {
      expect(roundUpToFifteenMinutes(0)).toBe(0);
    });

    it(`should round 1 to 15`, () => {
      expect(roundUpToFifteenMinutes(1)).toBe(15);
    });

    it(`should round 15 to 15`, () => {
      expect(roundUpToFifteenMinutes(15)).toBe(15);
    });

    it(`should round 16 to 30`, () => {
      expect(roundUpToFifteenMinutes(16)).toBe(30);
    });

    it(`should round 30 to 30`, () => {
      expect(roundUpToFifteenMinutes(30)).toBe(30);
    });

    it(`should round 44 to 45`, () => {
      expect(roundUpToFifteenMinutes(44)).toBe(45);
    });

    it(`should round 45 to 45`, () => {
      expect(roundUpToFifteenMinutes(45)).toBe(45);
    });

    it(`should round 59 to 60`, () => {
      expect(roundUpToFifteenMinutes(59)).toBe(60);
    });
  });

  describe(`roundTimestampToFifteenMinutes`, () => {
    it(`should not change timestamp already on 15-min boundary`, () => {
      const timestamp = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const result = roundTimestampToFifteenMinutes(timestamp);
      expect(result).toBe(timestamp);
    });

    it(`should round up 10:01 to 10:15`, () => {
      const timestamp = dayjs.utc(`2024-01-15 10:01:00`).valueOf();
      const expected = dayjs.utc(`2024-01-15 10:15:00`).valueOf();
      const result = roundTimestampToFifteenMinutes(timestamp);
      expect(result).toBe(expected);
    });

    it(`should round up 10:16 to 10:30`, () => {
      const timestamp = dayjs.utc(`2024-01-15 10:16:00`).valueOf();
      const expected = dayjs.utc(`2024-01-15 10:30:00`).valueOf();
      const result = roundTimestampToFifteenMinutes(timestamp);
      expect(result).toBe(expected);
    });

    it(`should round up 10:59 to 11:00`, () => {
      const timestamp = dayjs.utc(`2024-01-15 10:59:00`).valueOf();
      const expected = dayjs.utc(`2024-01-15 11:00:00`).valueOf();
      const result = roundTimestampToFifteenMinutes(timestamp);
      expect(result).toBe(expected);
    });

    it(`should handle seconds and milliseconds`, () => {
      const timestamp = dayjs.utc(`2024-01-15 10:00:30.500`).valueOf();
      const expected = dayjs.utc(`2024-01-15 10:15:00`).valueOf();
      const result = roundTimestampToFifteenMinutes(timestamp);
      expect(result).toBe(expected);
    });
  });

  // ============================================================================
  // Date Calculations
  // ============================================================================

  describe(`getStartOfWeek`, () => {
    it(`should get start of week for a date`, () => {
      // 2024-01-15 is Monday
      const dateMs = dayjs.utc(`2024-01-15`).valueOf();
      const result = getStartOfWeek(dateMs);
      
      // Start of week (Monday 2024-01-15 00:00:00 in dayjs default locale)
      const expected = dayjs.utc(`2024-01-15 00:00:00`).valueOf();
      expect(result).toBe(expected);
    });

    it(`should be pure - same input produces same output`, () => {
      const dateMs = dayjs.utc(`2024-01-15`).valueOf();
      const result1 = getStartOfWeek(dateMs);
      const result2 = getStartOfWeek(dateMs);
      expect(result1).toBe(result2);
    });
  });

  describe(`getEndOfWeek`, () => {
    it(`should get end of week for a date`, () => {
      // 2024-01-15 is Monday
      const dateMs = dayjs.utc(`2024-01-15`).valueOf();
      const result = getEndOfWeek(dateMs);
      
      // End of week (Sunday 2024-01-21 23:59:59.999 in dayjs default locale)
      const expected = dayjs.utc(`2024-01-21`).endOf(`day`).valueOf();
      expect(result).toBe(expected);
    });
  });

  describe(`getDayOfWeek`, () => {
    it(`should return 0 for Sunday`, () => {
      const dateMs = dayjs.utc(`2024-01-14`).valueOf(); // Sunday
      expect(getDayOfWeek(dateMs)).toBe(0);
    });

    it(`should return 1 for Monday`, () => {
      const dateMs = dayjs.utc(`2024-01-15`).valueOf(); // Monday
      expect(getDayOfWeek(dateMs)).toBe(1);
    });

    it(`should return 6 for Saturday`, () => {
      const dateMs = dayjs.utc(`2024-01-20`).valueOf(); // Saturday
      expect(getDayOfWeek(dateMs)).toBe(6);
    });
  });

  describe(`formatToISODate`, () => {
    it(`should format timestamp to YYYY-MM-DD`, () => {
      const timestamp = dayjs.utc(`2024-01-15 14:30:00`).valueOf();
      const result = formatToISODate(timestamp);
      expect(result).toBe(`2024-01-15`);
    });

    it(`should be pure`, () => {
      const timestamp = dayjs.utc(`2024-01-15 14:30:00`).valueOf();
      const result1 = formatToISODate(timestamp);
      const result2 = formatToISODate(timestamp);
      expect(result1).toBe(result2);
    });
  });

  describe(`parseISODateToTimestamp`, () => {
    it(`should parse ISO date to timestamp at start of day UTC`, () => {
      const dateISO = `2024-01-15` as Date_ISO_Type;
      const result = parseISODateToTimestamp(dateISO);
      const expected = dayjs.utc(`2024-01-15 00:00:00`).valueOf();
      expect(result).toBe(expected);
    });

    it(`should be pure`, () => {
      const dateISO = `2024-01-15` as Date_ISO_Type;
      const result1 = parseISODateToTimestamp(dateISO);
      const result2 = parseISODateToTimestamp(dateISO);
      expect(result1).toBe(result2);
    });
  });

  // ============================================================================
  // Timezone Conversions
  // ============================================================================

  describe(`combineDateTimeInTimezone`, () => {
    it(`should combine date and time in Europe/Berlin timezone to UTC`, () => {
      const dateISO = `2024-01-15` as Date_ISO_Type;
      const timeHMS = `14:30:00` as Time_HH_MM_SS_Type;
      const timezone = `Europe/Berlin`;

      const result = combineDateTimeInTimezone(dateISO, timeHMS, timezone);

      // Berlin is UTC+1 in January (winter time)
      // 14:30 Berlin = 13:30 UTC
      const expected = dayjs.utc(`2024-01-15 13:30:00`).valueOf();
      expect(result).toBe(expected);
    });

    it(`should handle daylight saving time correctly`, () => {
      const dateISO = `2024-07-15` as Date_ISO_Type;
      const timeHMS = `14:30:00` as Time_HH_MM_SS_Type;
      const timezone = `Europe/Berlin`;

      const result = combineDateTimeInTimezone(dateISO, timeHMS, timezone);

      // Berlin is UTC+2 in July (summer time)
      // 14:30 Berlin = 12:30 UTC
      const expected = dayjs.utc(`2024-07-15 12:30:00`).valueOf();
      expect(result).toBe(expected);
    });

    it(`should be pure`, () => {
      const dateISO = `2024-01-15` as Date_ISO_Type;
      const timeHMS = `14:30:00` as Time_HH_MM_SS_Type;
      const timezone = `Europe/Berlin`;

      const result1 = combineDateTimeInTimezone(dateISO, timeHMS, timezone);
      const result2 = combineDateTimeInTimezone(dateISO, timeHMS, timezone);

      expect(result1).toBe(result2);
    });
  });

  describe(`formatTimestampToTimeInTimezone`, () => {
    it(`should format UTC timestamp to Berlin time`, () => {
      // 2024-01-15 13:30:00 UTC = 14:30:00 Berlin (winter)
      const timestampMs = dayjs.utc(`2024-01-15 13:30:00`).valueOf();
      const result = formatTimestampToTimeInTimezone(timestampMs, `Europe/Berlin`);

      expect(result).toBe(`14:30:00`);
    });

    it(`should handle daylight saving time correctly`, () => {
      // 2024-07-15 12:30:00 UTC = 14:30:00 Berlin (summer)
      const timestampMs = dayjs.utc(`2024-07-15 12:30:00`).valueOf();
      const result = formatTimestampToTimeInTimezone(timestampMs, `Europe/Berlin`);

      expect(result).toBe(`14:30:00`);
    });
  });

  // ============================================================================
  // Timestamp Comparisons
  // ============================================================================

  describe(`isTimestampSameOrAfter`, () => {
    it(`should return true when timestamp is after reference`, () => {
      const timestamp = 2000;
      const reference = 1000;
      expect(isTimestampSameOrAfter(timestamp, reference)).toBe(true);
    });

    it(`should return true when timestamp equals reference`, () => {
      const timestamp = 1000;
      const reference = 1000;
      expect(isTimestampSameOrAfter(timestamp, reference)).toBe(true);
    });

    it(`should return false when timestamp is before reference`, () => {
      const timestamp = 500;
      const reference = 1000;
      expect(isTimestampSameOrAfter(timestamp, reference)).toBe(false);
    });
  });

  describe(`isTimestampBefore`, () => {
    it(`should return true when timestamp is before reference`, () => {
      const timestamp = 500;
      const reference = 1000;
      expect(isTimestampBefore(timestamp, reference)).toBe(true);
    });

    it(`should return false when timestamp equals reference`, () => {
      const timestamp = 1000;
      const reference = 1000;
      expect(isTimestampBefore(timestamp, reference)).toBe(false);
    });

    it(`should return false when timestamp is after reference`, () => {
      const timestamp = 2000;
      const reference = 1000;
      expect(isTimestampBefore(timestamp, reference)).toBe(false);
    });
  });

  describe(`getStartOfDay`, () => {
    it(`should get start of day for timestamp`, () => {
      const timestamp = dayjs.utc(`2024-01-15 14:30:45`).valueOf();
      const result = getStartOfDay(timestamp);
      const expected = dayjs.utc(`2024-01-15 00:00:00`).valueOf();
      expect(result).toBe(expected);
    });
  });
});

// Import additional functions for new tests
import {
  normalizeAppointment,
  filterAppointmentsByDate,
  filterAppointmentsByEmployee,
  appointmentsToBlockedTimes,
  parseAdvanceBookingTime,
  calculateAdvanceBookingBlockedTime,
  generateDateRange,
  isDateTodayOrFuture,
  NormalizedAppointmentPure,
} from '@/services/calendar/calendarUtils.pure.js';

describe(`calendarUtils.pure - Advanced Functions`, () => {
  
  // ============================================================================
  // Normalization Functions
  // ============================================================================
  
  describe(`normalizeAppointment`, () => {
    it(`should normalize appointment data`, () => {
      const result = normalizeAppointment(
        `2024-01-15`,
        `2024-01-15T10:00:00.000Z`,
        `2024-01-15T11:00:00.000Z`,
        123,
      );

      expect(result.dateISO).toBe(`2024-01-15`);
      expect(result.employeeId).toBe(123);
      expect(result.startTimeMs).toBe(dayjs.utc(`2024-01-15T10:00:00.000Z`).valueOf());
      expect(result.endTimeMs).toBe(dayjs.utc(`2024-01-15T11:00:00.000Z`).valueOf());
    });

    it(`should be pure`, () => {
      const result1 = normalizeAppointment(
        `2024-01-15`,
        `2024-01-15T10:00:00.000Z`,
        `2024-01-15T11:00:00.000Z`,
        123,
      );
      
      const result2 = normalizeAppointment(
        `2024-01-15`,
        `2024-01-15T10:00:00.000Z`,
        `2024-01-15T11:00:00.000Z`,
        123,
      );

      expect(result1).toEqual(result2);
    });
  });

  describe(`filterAppointmentsByDate`, () => {
    const appointments: NormalizedAppointmentPure[] = [
      {
        dateISO: `2024-01-15` as Date_ISO_Type,
        startTimeMs: 1000,
        endTimeMs: 2000,
        employeeId: 1,
      },
      {
        dateISO: `2024-01-16` as Date_ISO_Type,
        startTimeMs: 3000,
        endTimeMs: 4000,
        employeeId: 2,
      },
      {
        dateISO: `2024-01-15` as Date_ISO_Type,
        startTimeMs: 5000,
        endTimeMs: 6000,
        employeeId: 3,
      },
    ];

    it(`should filter appointments by date`, () => {
      const result = filterAppointmentsByDate(appointments, `2024-01-15` as Date_ISO_Type);
      expect(result).toHaveLength(2);
      expect(result[0].employeeId).toBe(1);
      expect(result[1].employeeId).toBe(3);
    });

    it(`should return empty array if no matches`, () => {
      const result = filterAppointmentsByDate(appointments, `2024-01-20` as Date_ISO_Type);
      expect(result).toHaveLength(0);
    });

    it(`should not mutate original array`, () => {
      const original = [...appointments];
      filterAppointmentsByDate(appointments, `2024-01-15` as Date_ISO_Type);
      expect(appointments).toEqual(original);
    });
  });

  describe(`filterAppointmentsByEmployee`, () => {
    const appointments: NormalizedAppointmentPure[] = [
      {
        dateISO: `2024-01-15` as Date_ISO_Type,
        startTimeMs: 1000,
        endTimeMs: 2000,
        employeeId: 1,
      },
      {
        dateISO: `2024-01-16` as Date_ISO_Type,
        startTimeMs: 3000,
        endTimeMs: 4000,
        employeeId: 2,
      },
      {
        dateISO: `2024-01-15` as Date_ISO_Type,
        startTimeMs: 5000,
        endTimeMs: 6000,
        employeeId: 1,
      },
    ];

    it(`should filter appointments by employee`, () => {
      const result = filterAppointmentsByEmployee(appointments, 1);
      expect(result).toHaveLength(2);
      expect(result[0].dateISO).toBe(`2024-01-15`);
      expect(result[1].dateISO).toBe(`2024-01-15`);
    });

    it(`should return empty array if no matches`, () => {
      const result = filterAppointmentsByEmployee(appointments, 999);
      expect(result).toHaveLength(0);
    });
  });

  describe(`appointmentsToBlockedTimes`, () => {
    it(`should convert appointments to blocked times`, () => {
      const appointments: NormalizedAppointmentPure[] = [
        {
          dateISO: `2024-01-15` as Date_ISO_Type,
          startTimeMs: 1000,
          endTimeMs: 2000,
          employeeId: 1,
        },
        {
          dateISO: `2024-01-15` as Date_ISO_Type,
          startTimeMs: 3000,
          endTimeMs: 4000,
          employeeId: 1,
        },
      ];

      const result = appointmentsToBlockedTimes(appointments);

      expect(result).toHaveLength(2);
      expect(result[0].startBlockedTimeMs).toBe(1000);
      expect(result[0].endBlockedTimeMs).toBe(2000);
      expect(result[1].startBlockedTimeMs).toBe(3000);
      expect(result[1].endBlockedTimeMs).toBe(4000);
    });

    it(`should return empty array for empty input`, () => {
      const result = appointmentsToBlockedTimes([]);
      expect(result).toHaveLength(0);
    });
  });

  // ============================================================================
  // Advance Booking Time Functions
  // ============================================================================
  
  describe(`parseAdvanceBookingTime`, () => {
    it(`should parse HH:MM:SS format`, () => {
      const result = parseAdvanceBookingTime(`01:30:00`);
      expect(result).toBe(5400000); // 1.5 hours in milliseconds
    });

    it(`should parse next_day`, () => {
      const result = parseAdvanceBookingTime(`next_day`);
      expect(result).toBe(`next_day`);
    });

    it(`should parse zero time`, () => {
      const result = parseAdvanceBookingTime(`00:00:00`);
      expect(result).toBe(0);
    });
  });

  describe(`calculateAdvanceBookingBlockedTime`, () => {
    it(`should block entire day for next_day setting`, () => {
      const currentTimeMs = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 17:00:00`).valueOf();
      
      const result = calculateAdvanceBookingBlockedTime(
        currentTimeMs,
        `next_day`,
        startWorkingMs,
        endWorkingMs,
        `2024-01-15` as Date_ISO_Type,
        `2024-01-15` as Date_ISO_Type,
      );

      expect(result).not.toBeNull();
      expect(result?.startBlockedTimeMs).toBe(startWorkingMs);
      expect(result?.endBlockedTimeMs).toBe(endWorkingMs);
    });

    it(`should block from start until advance time`, () => {
      const currentTimeMs = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const advanceTimeMs = 2 * 60 * 60 * 1000; // 2 hours
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 17:00:00`).valueOf();
      
      const result = calculateAdvanceBookingBlockedTime(
        currentTimeMs,
        advanceTimeMs,
        startWorkingMs,
        endWorkingMs,
        `2024-01-15` as Date_ISO_Type,
        `2024-01-15` as Date_ISO_Type,
      );

      expect(result).not.toBeNull();
      expect(result?.startBlockedTimeMs).toBe(startWorkingMs);
      // Should block until 10:00 + 2 hours = 12:00
      expect(result?.endBlockedTimeMs).toBe(dayjs.utc(`2024-01-15 12:00:00`).valueOf());
    });

    it(`should return null for non-today dates`, () => {
      const currentTimeMs = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const startWorkingMs = dayjs.utc(`2024-01-16 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-16 17:00:00`).valueOf();
      
      const result = calculateAdvanceBookingBlockedTime(
        currentTimeMs,
        `next_day`,
        startWorkingMs,
        endWorkingMs,
        `2024-01-15` as Date_ISO_Type,
        `2024-01-16` as Date_ISO_Type,
      );

      expect(result).toBeNull();
    });

    it(`should block entire day if advance time exceeds working hours`, () => {
      const currentTimeMs = dayjs.utc(`2024-01-15 10:00:00`).valueOf();
      const advanceTimeMs = 10 * 60 * 60 * 1000; // 10 hours
      const startWorkingMs = dayjs.utc(`2024-01-15 08:00:00`).valueOf();
      const endWorkingMs = dayjs.utc(`2024-01-15 17:00:00`).valueOf();
      
      const result = calculateAdvanceBookingBlockedTime(
        currentTimeMs,
        advanceTimeMs,
        startWorkingMs,
        endWorkingMs,
        `2024-01-15` as Date_ISO_Type,
        `2024-01-15` as Date_ISO_Type,
      );

      expect(result).not.toBeNull();
      expect(result?.startBlockedTimeMs).toBe(startWorkingMs);
      expect(result?.endBlockedTimeMs).toBe(endWorkingMs);
    });
  });

  // ============================================================================
  // Period Generation Functions
  // ============================================================================
  
  describe(`generateDateRange`, () => {
    it(`should generate range of dates`, () => {
      const start = dayjs.utc(`2024-01-15`).valueOf();
      const end = dayjs.utc(`2024-01-17`).valueOf();
      
      const result = generateDateRange(start, end);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe(dayjs.utc(`2024-01-15 00:00:00`).valueOf());
      expect(result[1]).toBe(dayjs.utc(`2024-01-16 00:00:00`).valueOf());
      expect(result[2]).toBe(dayjs.utc(`2024-01-17 00:00:00`).valueOf());
    });

    it(`should handle single day range`, () => {
      const date = dayjs.utc(`2024-01-15`).valueOf();
      
      const result = generateDateRange(date, date);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(dayjs.utc(`2024-01-15 00:00:00`).valueOf());
    });

    it(`should normalize times to start of day`, () => {
      const start = dayjs.utc(`2024-01-15 14:30:00`).valueOf();
      const end = dayjs.utc(`2024-01-16 16:45:00`).valueOf();
      
      const result = generateDateRange(start, end);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(dayjs.utc(`2024-01-15 00:00:00`).valueOf());
      expect(result[1]).toBe(dayjs.utc(`2024-01-16 00:00:00`).valueOf());
    });
  });

  describe(`isDateTodayOrFuture`, () => {
    it(`should return true for future date`, () => {
      const today = dayjs.utc(`2024-01-15`).valueOf();
      const futureDate = dayjs.utc(`2024-01-20`).valueOf();
      
      expect(isDateTodayOrFuture(futureDate, today)).toBe(true);
    });

    it(`should return true for today`, () => {
      const today = dayjs.utc(`2024-01-15`).valueOf();
      const sameDay = dayjs.utc(`2024-01-15 14:30:00`).valueOf();
      
      expect(isDateTodayOrFuture(sameDay, today)).toBe(true);
    });

    it(`should return false for past date`, () => {
      const today = dayjs.utc(`2024-01-15`).valueOf();
      const pastDate = dayjs.utc(`2024-01-10`).valueOf();
      
      expect(isDateTodayOrFuture(pastDate, today)).toBe(false);
    });
  });
});

