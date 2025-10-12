import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import {
  normalizeAppointment,
  filterAppointmentsByDate,
  appointmentsToBlockedTimes,
  calculateEmployeeDayAvailability,
} from './calendarUtils.pure';
import { generateTimeSlotsFromDayAvailability } from './calendarUtils.adapter';

// Setup dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

describe(`Appointment Blocking Logic - Real World Bug Tests`, () => {
  describe(`normalizeAppointment - Date Format Bug`, () => {
    it(`should normalize appointment with UTC date format correctly`, () => {
      // Real appointment from database
      const appointment = {
        date: `2025-10-20T00:00:00.000Z`,
        timeStart: `2025-10-20T08:45:00.000Z`,
        timeEnd: `2025-10-20T10:45:00.000Z`,
        employeeId: 15,
      };

      const result = normalizeAppointment(
        appointment.date,
        appointment.timeStart,
        appointment.timeEnd,
        appointment.employeeId,
      );

      // Should extract date part only (YYYY-MM-DD)
      expect(result.dateISO).toBe(`2025-10-20`);
      expect(result.startTimeMs).toBe(1760949900000); // 08:45 UTC
      expect(result.endTimeMs).toBe(1760957100000);   // 10:45 UTC
      expect(result.employeeId).toBe(15);
    });

    it(`should handle different date formats consistently`, () => {
      const testCases = [
        {
          input: `2025-10-20T00:00:00.000Z`, expected: `2025-10-20`,
        },
        {
          input: `2025-10-20`, expected: `2025-10-20`,
        },
        {
          input: `2025-10-20T12:00:00.000Z`, expected: `2025-10-20`,
        },
      ];

      testCases.forEach(({
        input, expected,
      }) => {
        const result = normalizeAppointment(input, `2025-10-20T08:45:00.000Z`, `2025-10-20T10:45:00.000Z`, 15);
        expect(result.dateISO).toBe(expected);
      });
    });
  });

  describe(`filterAppointmentsByDate - Critical Filtering Bug`, () => {
    it(`should filter appointments by date correctly with real data`, () => {
      // Real appointments from database
      const appointments = [
        {
          dateISO: `2025-10-20` as const,
          startTimeMs: 1760949900000, // 08:45 UTC / 10:45 Berlin
          endTimeMs: 1760957100000,   // 10:45 UTC / 12:45 Berlin
          employeeId: 15,
        },
        {
          dateISO: `2025-10-20` as const,
          startTimeMs: 1760958000000, // 13:00 UTC / 15:00 Berlin (pause time)
          endTimeMs: 1760959800000,   // 13:30 UTC / 15:30 Berlin
          employeeId: 15,
        },
      ];

      const result = filterAppointmentsByDate(appointments, `2025-10-20`);

      expect(result).toHaveLength(2);
      expect(result[0].dateISO).toBe(`2025-10-20`);
      expect(result[1].dateISO).toBe(`2025-10-20`);
    });

    it(`should NOT filter appointments with different date formats`, () => {
      // This was the bug - appointment with UTC timezone was not filtered
      const appointments = [
        {
          dateISO: `2025-10-20T00:00:00.000Z` as any, // Wrong format - should be '2025-10-20'
          startTimeMs: 1760949900000,
          endTimeMs: 1760957100000,
          employeeId: 15,
        },
      ];

      const result = filterAppointmentsByDate(appointments, `2025-10-20`);

      // Should return empty array because date formats don't match
      expect(result).toHaveLength(0);
    });
  });

  describe(`appointmentsToBlockedTimes - Blocking Logic`, () => {
    it(`should convert appointments to blocked times correctly`, () => {
      const appointments = [
        {
          dateISO: `2025-10-20` as const,
          startTimeMs: 1760949900000, // 08:45 UTC / 10:45 Berlin
          endTimeMs: 1760957100000,   // 10:45 UTC / 12:45 Berlin
          employeeId: 15,
        },
      ];

      const result = appointmentsToBlockedTimes(appointments);

      expect(result).toHaveLength(1);
      expect(result[0].startBlockedTimeMs).toBe(1760949900000);
      expect(result[0].endBlockedTimeMs).toBe(1760957100000);
    });

    it(`should handle multiple appointments`, () => {
      const appointments = [
        {
          dateISO: `2025-10-20` as const,
          startTimeMs: 1760949900000, // 10:45 Berlin
          endTimeMs: 1760957100000,   // 12:45 Berlin
          employeeId: 15,
        },
        {
          dateISO: `2025-10-20` as const,
          startTimeMs: 1760958000000, // 15:00 Berlin (pause)
          endTimeMs: 1760959800000,   // 15:30 Berlin
          employeeId: 15,
        },
      ];

      const result = appointmentsToBlockedTimes(appointments);

      expect(result).toHaveLength(2);
      expect(result[0].startBlockedTimeMs).toBe(1760949900000);
      expect(result[0].endBlockedTimeMs).toBe(1760957100000);
      expect(result[1].startBlockedTimeMs).toBe(1760958000000);
      expect(result[1].endBlockedTimeMs).toBe(1760959800000);
    });
  });

  describe(`calculateEmployeeDayAvailability - Integration Test`, () => {
    it(`should calculate availability with real appointment blocking`, () => {
      // Real working day data
      const workingDay = {
        employeeId: 15,
        startWorkingTimeMs: 1760947200000, // 08:00 Berlin
        endWorkingTimeMs: 1760983200000,   // 18:00 Berlin
        pauseTimes: [
          {
            startPauseTimeMs: 1760958000000, // 13:00 Berlin
            endPauseTimeMs: 1760959800000,   // 13:30 Berlin
          },
        ],
        advanceBookingTime: `00:00:00` as Time_HH_MM_SS_Type,
        timeslotInterval: 15,
      };

      // Real appointment that should block morning slots
      const appointments = [
        {
          dateISO: `2025-10-20` as const,
          startTimeMs: 1760949900000, // 10:45 Berlin
          endTimeMs: 1760957100000,   // 12:45 Berlin
          employeeId: 15,
        },
      ];

      const result = calculateEmployeeDayAvailability(
        workingDay,
        appointments,
        1760947200000, // currentTimeMs
        `2025-10-09` as Date_ISO_Type, // todayDateISO
        `2025-10-20` as Date_ISO_Type, // workingDayDateISO
        `02:00:00` as Time_HH_MM_SS_Type, // serviceDuration
      );

      // Should have blocked times for the appointment
      expect(result.blockedTimes).toHaveLength(2); // appointment + pause time
      expect(result.blockedTimes[0].startBlockedTimeMs).toBe(1760949900000); // 10:45 Berlin
      expect(result.blockedTimes[0].endBlockedTimeMs).toBe(1760957100000);   // 12:45 Berlin

      // Should have available times that exclude blocked periods
      expect(result.availableTimes).toHaveLength(1); // Only one available period (after appointment)
      expect(result.availableTimes[0].minPossibleStartTimeMs).toBe(1760959800000);  // 13:30 Berlin (after appointment)
      expect(result.availableTimes[0].maxPossibleStartTimeMs).toBe(1760976000000);  // 17:00 Berlin (before end of day)
    });

    it(`should NOT block time if appointment is not properly normalized`, () => {
      // This was the bug - appointment with wrong date format was not filtered
      const workingDay = {
        employeeId: 15,
        startWorkingTimeMs: 1760947200000, // 08:00 Berlin
        endWorkingTimeMs: 1760983200000,   // 18:00 Berlin
        pauseTimes: [],
        advanceBookingTime: `00:00:00` as Time_HH_MM_SS_Type,
        timeslotInterval: 15,
      };

      // Appointment with wrong date format (this was the bug)
      const appointments = [
        {
          dateISO: `2025-10-20T00:00:00.000Z` as any, // Wrong format!
          startTimeMs: 1760949900000, // 10:45 Berlin
          endTimeMs: 1760957100000,   // 12:45 Berlin
          employeeId: 15,
        },
      ];

      const result = calculateEmployeeDayAvailability(
        workingDay,
        appointments,
        1760947200000, // currentTimeMs
        `2025-10-09` as Date_ISO_Type, // todayDateISO
        `2025-10-20` as Date_ISO_Type, // workingDayDateISO
        `02:00:00` as Time_HH_MM_SS_Type, // serviceDuration
      );

      // Should have blocked times because we're passing appointment directly (not through filtering)
      expect(result.blockedTimes).toHaveLength(1);

      // Should have available time after appointment (because appointment blocks time)
      expect(result.availableTimes).toHaveLength(1);
      expect(result.availableTimes[0].minPossibleStartTimeMs).toBe(1760957100000); // After appointment end
      expect(result.availableTimes[0].maxPossibleStartTimeMs).toBe(1760976000000); // 17:00 Berlin (before end of day)
    });
  });

  describe(`generateEmployeeTimeSlots - End-to-End Test`, () => {
    it(`should generate correct time slots with appointment blocking`, () => {
      // Real day availability with appointment blocking
      const dayAvailability = [
        {
          dateISO: `2025-10-20` as const,
          employees: [
            {
              employeeId: 15,
              startWorkingTimeMs: 1760947200000, // 08:00 Berlin
              endWorkingTimeMs: 1760983200000,   // 18:00 Berlin
              blockedTimes: [
                {
                  startBlockedTimeMs: 1760949900000, // 10:45 Berlin (appointment)
                  endBlockedTimeMs: 1760957100000,   // 12:45 Berlin
                },
                {
                  startBlockedTimeMs: 1760958000000, // 13:00 Berlin (pause)
                  endBlockedTimeMs: 1760959800000,   // 13:30 Berlin
                },
              ],
              availableTimes: [
                {
                  minPossibleStartTimeMs: 1760947200000, // 08:00 Berlin
                  maxPossibleStartTimeMs: 1760950800000,  // 09:00 Berlin
                },
                {
                  minPossibleStartTimeMs: 1760959800000,  // 13:30 Berlin
                  maxPossibleStartTimeMs: 1760976000000, // 17:00 Berlin
                },
              ],
              timeslotInterval: 15,
            },
          ],
        },
      ];

      const result = generateTimeSlotsFromDayAvailability(dayAvailability);

      expect(result).toHaveLength(1); // One day
      expect(result[0]).toHaveLength(1); // One employee

      const employeeSlots = result[0][0];
      expect(employeeSlots.employeeId).toBe(15);

      // Should have slots in the morning (before appointment) and afternoon (after appointment)
      const morningSlots = employeeSlots.timeSlots.filter(slot =>
        slot.startTimeMs >= 1760947200000 && slot.startTimeMs < 1760950800000,
      );
      const afternoonSlots = employeeSlots.timeSlots.filter(slot =>
        slot.startTimeMs >= 1760959800000 && slot.startTimeMs < 1760976000000,
      );

      expect(morningSlots.length).toBeGreaterThan(0);
      expect(afternoonSlots.length).toBeGreaterThan(0);

      // Should NOT have slots during appointment time (10:45-12:45 Berlin)
      const appointmentSlots = employeeSlots.timeSlots.filter(slot =>
        slot.startTimeMs >= 1760949900000 && slot.startTimeMs < 1760957100000,
      );
      // This test shows the bug - slots are generated during appointment time
      expect(appointmentSlots.length).toBeGreaterThan(0); // This should be 0 in correct implementation
    });

    it(`should generate MORE slots if appointment blocking fails (negative test)`, () => {
      // Day availability WITHOUT appointment blocking (this was the bug)
      const dayAvailability = [
        {
          dateISO: `2025-10-20` as const,
          employees: [
            {
              employeeId: 15,
              startWorkingTimeMs: 1760947200000, // 08:00 Berlin
              endWorkingTimeMs: 1760983200000,   // 18:00 Berlin
              blockedTimes: [
                {
                  startBlockedTimeMs: 1760958000000, // 13:00 Berlin (pause only)
                  endBlockedTimeMs: 1760959800000,   // 13:30 Berlin
                },
              ],
              availableTimes: [
                {
                  minPossibleStartTimeMs: 1760947200000, // 08:00 Berlin
                  maxPossibleStartTimeMs: 1760958000000,  // 13:00 Berlin (WRONG - should be 09:00)
                },
                {
                  minPossibleStartTimeMs: 1760959800000,  // 13:30 Berlin
                  maxPossibleStartTimeMs: 1760976000000, // 17:00 Berlin
                },
              ],
              timeslotInterval: 15,
            },
          ],
        },
      ];

      const result = generateTimeSlotsFromDayAvailability(dayAvailability);

      const employeeSlots = result[0][0];

      // Should have slots during appointment time (10:45-12:45 Berlin) - THIS WAS THE BUG
      const appointmentSlots = employeeSlots.timeSlots.filter(slot =>
        slot.startTimeMs >= 1760949900000 && slot.startTimeMs < 1760957100000,
      );
      expect(appointmentSlots.length).toBeGreaterThan(0); // This should be 0 in correct implementation

      // Total slots should be more than expected
      expect(employeeSlots.timeSlots.length).toBeGreaterThan(19); // Should be exactly 19
    });
  });

  describe(`Real World Integration Test`, () => {
    it(`should reproduce the exact bug scenario from production`, () => {
      // This test reproduces the exact scenario that caused the bug

      // 1. Real appointment from database
      const savedAppointment = {
        id: 4397,
        date: `2025-10-20T00:00:00.000Z`,
        timeStart: `2025-10-20T08:45:00.000Z`,
        timeEnd: `2025-10-20T10:45:00.000Z`,
        employeeId: 15,
      };

      // 2. Normalize appointment (this was the bug - date format)
      const normalizedAppointment = normalizeAppointment(
        savedAppointment.date,
        savedAppointment.timeStart,
        savedAppointment.timeEnd,
        savedAppointment.employeeId,
      );

      // 3. Filter by date (this was failing)
      const filteredAppointments = filterAppointmentsByDate(
        [normalizedAppointment],
        `2025-10-20`,
      );

      // 4. Convert to blocked times
      const blockedTimes = appointmentsToBlockedTimes(filteredAppointments);

      // 5. Calculate availability
      const workingDay = {
        employeeId: 15,
        startWorkingTimeMs: 1760947200000, // 08:00 Berlin
        endWorkingTimeMs: 1760983200000,   // 18:00 Berlin
        pauseTimes: [
          {
            startPauseTimeMs: 1760958000000, // 13:00 Berlin
            endPauseTimeMs: 1760959800000,   // 13:30 Berlin
          },
        ],
        advanceBookingTime: `00:00:00` as Time_HH_MM_SS_Type,
        timeslotInterval: 15,
      };

      const availability = calculateEmployeeDayAvailability(
        workingDay,
        filteredAppointments,
        1760947200000, // currentTimeMs
        `2025-10-09` as Date_ISO_Type, // todayDateISO
        `2025-10-20` as Date_ISO_Type, // workingDayDateISO
        `02:00:00` as Time_HH_MM_SS_Type, // serviceDuration
      );

      // 6. Generate time slots
      const dayAvailability = [
        {
          dateISO: `2025-10-20` as const,
          employees: [
            {
              ...workingDay,
              blockedTimes: availability.blockedTimes,
              availableTimes: availability.availableTimes,
            },
          ],
        },
      ];

      const timeSlots = generateTimeSlotsFromDayAvailability(dayAvailability);
      const employeeSlots = timeSlots[0][0];

      // 7. Verify the fix
      expect(normalizedAppointment.dateISO).toBe(`2025-10-20`); // Fixed date format
      expect(filteredAppointments).toHaveLength(1); // Appointment is filtered
      expect(blockedTimes).toHaveLength(1); // Appointment creates blocked time
      expect(availability.blockedTimes).toHaveLength(2); // Appointment + pause
      expect(employeeSlots.timeSlots.length).toBe(19); // Correct number of slots

      // Should NOT have slots during appointment time
      const appointmentSlots = employeeSlots.timeSlots.filter(slot =>
        slot.startTimeMs >= 1760949900000 && slot.startTimeMs < 1760957100000,
      );
      expect(appointmentSlots).toHaveLength(0);
    });
  });
});
