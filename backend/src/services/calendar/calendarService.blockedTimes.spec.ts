// Tests for Employee Blocked Times normalization
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { EmployeeBlockedTimeData } from '@/services/employees/employeesBlockedTimesService.js';
import { EmployeeWithWorkingTimesType } from '@/services/calendar/calendarUtils.js';
import { TimeslotIntervalEnum } from '@/enums/enums.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import {
  normalizeBlockedTimesForEmployees,
  PeriodWithEmployeeWorkingTimeType,
} from './calendarUtils';

// Helper to create employee with all required fields
const createEmployee = (overrides: Partial<EmployeeWithWorkingTimesType>): EmployeeWithWorkingTimesType => ({
  employeeId: 101,
  startWorkingTime: dayjs.utc(`2024-01-15T09:00:00.000Z`),
  endWorkingTime: dayjs.utc(`2024-01-15T17:00:00.000Z`),
  pauseTimes: [],
  advanceBookingTime: `00:00:00` as Time_HH_MM_SS_Type,
  timeslotInterval: TimeslotIntervalEnum.Thirty,
  ...overrides,
});

describe(`calendarService - Employee Blocked Times Integration`, () => {
  describe(`normalizeBlockedTimesForEmployees - Single-day blocked time`, () => {
    it(`should normalize a single blocked time slot correctly`, () => {
      // Arrange: Employee works Mon 10:00-18:00 in Berlin timezone
      // MySQL returns blocked_date as Date object at midnight UTC
      // 2024-01-15 in Berlin = 2024-01-14T23:00:00.000Z in UTC (winter time, UTC+1)
      const periodWithDays: PeriodWithEmployeeWorkingTimeType[] = [
        {
          day: `2024-01-15` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-01-15T09:00:00.000Z`), // 10:00 Berlin
              endWorkingTime: dayjs.utc(`2024-01-15T17:00:00.000Z`),   // 18:00 Berlin
            }),
          ],
        },
      ];

      // Blocked time: Mon 12:00-14:00 Berlin time
      const blockedTimes: EmployeeBlockedTimeData[] = [
        {
          id: 1,
          employeeId: 101,
          groupId: null,
          blockedDate: new Date(`2024-01-14T23:00:00.000Z`) as any, // MySQL DATE for 2024-01-15
          startTime: `12:00:00` as Time_HH_MM_SS_Type,
          endTime: `14:00:00` as Time_HH_MM_SS_Type,
          isAllDay: false,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
      ];

      // Act
      const result = normalizeBlockedTimesForEmployees(blockedTimes, periodWithDays);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].employeeId).toBe(101);
      expect(result[0].date).toBe(`2024-01-15`);

      // Times should be converted from Berlin to UTC
      // 12:00 Berlin (winter) = 11:00 UTC
      // 14:00 Berlin (winter) = 13:00 UTC
      expect(result[0].timeStart).toBe(`2024-01-15T11:00:00.000Z`);
      expect(result[0].timeEnd).toBe(`2024-01-15T13:00:00.000Z`);
    });

    it(`should normalize all-day blocked time using employee working hours`, () => {
      // Arrange
      const periodWithDays: PeriodWithEmployeeWorkingTimeType[] = [
        {
          day: `2024-01-15` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-01-15T09:00:00.000Z`), // 10:00 Berlin
              endWorkingTime: dayjs.utc(`2024-01-15T17:00:00.000Z`),   // 18:00 Berlin
            }),
          ],
        },
      ];

      const blockedTimes: EmployeeBlockedTimeData[] = [
        {
          id: 1,
          employeeId: 101,
          groupId: null,
          blockedDate: new Date(`2024-01-14T23:00:00.000Z`) as any,
          startTime: null,
          endTime: null,
          isAllDay: true,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
      ];

      // Act
      const result = normalizeBlockedTimesForEmployees(blockedTimes, periodWithDays);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].employeeId).toBe(101);
      expect(result[0].date).toBe(`2024-01-15`);

      // Should use employee's working hours
      expect(result[0].timeStart).toBe(`2024-01-15T09:00:00.000Z`);
      expect(result[0].timeEnd).toBe(`2024-01-15T17:00:00.000Z`);
    });

    it(`should skip all-day blocked time if employee not found in period`, () => {
      // Arrange: All-day blocks require employee to be in period
      const periodWithDays: PeriodWithEmployeeWorkingTimeType[] = [
        {
          day: `2024-01-15` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 102, // Different employee
              startWorkingTime: dayjs.utc(`2024-01-15T09:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-01-15T17:00:00.000Z`),
            }),
          ],
        },
      ];

      const blockedTimes: EmployeeBlockedTimeData[] = [
        {
          id: 1,
          employeeId: 101, // Not in period
          groupId: null,
          blockedDate: new Date(`2024-01-14T23:00:00.000Z`) as any,
          startTime: null,
          endTime: null,
          isAllDay: true, // All-day requires employee lookup
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
      ];

      // Act
      const result = normalizeBlockedTimesForEmployees(blockedTimes, periodWithDays);

      // Assert
      expect(result.length).toBe(0); // Should be empty for all-day when employee not found
    });

    it(`should skip all-day blocked time if day not found in period`, () => {
      // Arrange: All-day blocks require day to be in period
      const periodWithDays: PeriodWithEmployeeWorkingTimeType[] = [
        {
          day: `2024-01-16` as Date_ISO_Type, // Different day
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-01-16T09:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-01-16T17:00:00.000Z`),
            }),
          ],
        },
      ];

      const blockedTimes: EmployeeBlockedTimeData[] = [
        {
          id: 1,
          employeeId: 101,
          groupId: null,
          blockedDate: new Date(`2024-01-14T23:00:00.000Z`) as any, // 2024-01-15
          startTime: null,
          endTime: null,
          isAllDay: true, // All-day requires day lookup
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
      ];

      // Act
      const result = normalizeBlockedTimesForEmployees(blockedTimes, periodWithDays);

      // Assert
      expect(result.length).toBe(0); // Should be empty for all-day when day not found
    });
  });

  describe(`normalizeBlockedTimesForEmployees - Multi-day blocked time (group_id)`, () => {
    it(`should normalize vacation with multiple blocked days`, () => {
      // Arrange: 3-day vacation (all-day)
      const groupId = `vacation-uuid-123`;

      const periodWithDays: PeriodWithEmployeeWorkingTimeType[] = [
        {
          day: `2024-01-15` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-01-15T09:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-01-15T17:00:00.000Z`),
            }),
          ],
        },
        {
          day: `2024-01-16` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-01-16T09:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-01-16T17:00:00.000Z`),
            }),
          ],
        },
        {
          day: `2024-01-17` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-01-17T09:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-01-17T17:00:00.000Z`),
            }),
          ],
        },
      ];

      const blockedTimes: EmployeeBlockedTimeData[] = [
        {
          id: 1,
          groupId,
          employeeId: 101,
          blockedDate: new Date(`2024-01-14T23:00:00.000Z`) as any, // 2024-01-15
          startTime: null,
          endTime: null,
          isAllDay: true,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
        {
          id: 2,
          groupId,
          employeeId: 101,
          blockedDate: new Date(`2024-01-15T23:00:00.000Z`) as any, // 2024-01-16
          startTime: null,
          endTime: null,
          isAllDay: true,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
        {
          id: 3,
          groupId,
          employeeId: 101,
          blockedDate: new Date(`2024-01-16T23:00:00.000Z`) as any, // 2024-01-17
          startTime: null,
          endTime: null,
          isAllDay: true,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
      ];

      // Act
      const result = normalizeBlockedTimesForEmployees(blockedTimes, periodWithDays);

      // Assert
      expect(result.length).toBe(3); // All 3 days normalized

      // Check first day
      expect(result[0].employeeId).toBe(101);
      expect(result[0].date).toBe(`2024-01-15`);
      expect(result[0].timeStart).toBe(`2024-01-15T09:00:00.000Z`);
      expect(result[0].timeEnd).toBe(`2024-01-15T17:00:00.000Z`);

      // Check second day
      expect(result[1].employeeId).toBe(101);
      expect(result[1].date).toBe(`2024-01-16`);

      // Check third day
      expect(result[2].employeeId).toBe(101);
      expect(result[2].date).toBe(`2024-01-17`);
    });

    it(`should normalize partial-day vacation (first day from 10:00, last day until 14:00)`, () => {
      // Arrange
      const groupId = `vacation-uuid-456`;

      const periodWithDays: PeriodWithEmployeeWorkingTimeType[] = [
        {
          day: `2024-12-10` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-12-10T07:00:00.000Z`), // 08:00 Berlin (winter)
              endWorkingTime: dayjs.utc(`2024-12-10T19:00:00.000Z`),   // 20:00 Berlin
            }),
          ],
        },
        {
          day: `2024-12-15` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-12-15T07:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-12-15T19:00:00.000Z`),
            }),
          ],
        },
      ];

      const blockedTimes: EmployeeBlockedTimeData[] = [
        // First day: 10:00-23:59 Berlin
        {
          id: 1,
          groupId,
          employeeId: 101,
          blockedDate: new Date(`2024-12-09T23:00:00.000Z`) as any, // 2024-12-10
          startTime: `10:00:00` as Time_HH_MM_SS_Type,
          endTime: `23:59:00` as Time_HH_MM_SS_Type,
          isAllDay: false,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
        // Last day: 00:00-14:00 Berlin
        {
          id: 6,
          groupId,
          employeeId: 101,
          blockedDate: new Date(`2024-12-14T23:00:00.000Z`) as any, // 2024-12-15
          startTime: `00:00:00` as Time_HH_MM_SS_Type,
          endTime: `14:00:00` as Time_HH_MM_SS_Type,
          isAllDay: false,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
      ];

      // Act
      const result = normalizeBlockedTimesForEmployees(blockedTimes, periodWithDays);

      // Assert
      expect(result.length).toBe(2);

      // First day: 10:00 Berlin = 09:00 UTC, 23:59 Berlin = 22:59 UTC
      expect(result[0].employeeId).toBe(101);
      expect(result[0].date).toBe(`2024-12-10`);
      expect(result[0].timeStart).toBe(`2024-12-10T09:00:00.000Z`);
      expect(result[0].timeEnd).toBe(`2024-12-10T22:59:00.000Z`);

      // Last day: 00:00 Berlin = 23:00 UTC (prev day), 14:00 Berlin = 13:00 UTC
      expect(result[1].employeeId).toBe(101);
      expect(result[1].date).toBe(`2024-12-15`);
      expect(result[1].timeStart).toBe(`2024-12-14T23:00:00.000Z`);
      expect(result[1].timeEnd).toBe(`2024-12-15T13:00:00.000Z`);
    });
  });

  describe(`normalizeBlockedTimesForEmployees - Multiple employees`, () => {
    it(`should normalize blocked times for different employees independently`, () => {
      // Arrange: Two employees, each with their own blocked time
      const periodWithDays: PeriodWithEmployeeWorkingTimeType[] = [
        {
          day: `2024-01-15` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-01-15T09:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-01-15T17:00:00.000Z`),
            }),
            createEmployee({
              employeeId: 102,
              startWorkingTime: dayjs.utc(`2024-01-15T09:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-01-15T17:00:00.000Z`),
            }),
          ],
        },
      ];

      const blockedTimes: EmployeeBlockedTimeData[] = [
        {
          id: 1,
          employeeId: 101,
          groupId: null,
          blockedDate: new Date(`2024-01-14T23:00:00.000Z`) as any,
          startTime: `12:00:00` as Time_HH_MM_SS_Type,
          endTime: `14:00:00` as Time_HH_MM_SS_Type,
          isAllDay: false,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
        {
          id: 2,
          employeeId: 102,
          groupId: null,
          blockedDate: new Date(`2024-01-14T23:00:00.000Z`) as any,
          startTime: `15:00:00` as Time_HH_MM_SS_Type,
          endTime: `16:00:00` as Time_HH_MM_SS_Type,
          isAllDay: false,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
      ];

      // Act
      const result = normalizeBlockedTimesForEmployees(blockedTimes, periodWithDays);

      // Assert
      expect(result.length).toBe(2);

      // Employee 101: 12:00-14:00 Berlin = 11:00-13:00 UTC
      expect(result[0].employeeId).toBe(101);
      expect(result[0].timeStart).toBe(`2024-01-15T11:00:00.000Z`);
      expect(result[0].timeEnd).toBe(`2024-01-15T13:00:00.000Z`);

      // Employee 102: 15:00-16:00 Berlin = 14:00-15:00 UTC
      expect(result[1].employeeId).toBe(102);
      expect(result[1].timeStart).toBe(`2024-01-15T14:00:00.000Z`);
      expect(result[1].timeEnd).toBe(`2024-01-15T15:00:00.000Z`);
    });
  });

  describe(`normalizeBlockedTimesForEmployees - Edge cases`, () => {
    it(`should return empty array when no blocked times provided`, () => {
      const periodWithDays: PeriodWithEmployeeWorkingTimeType[] = [
        {
          day: `2024-01-15` as Date_ISO_Type,
          employees: [
            createEmployee({
              employeeId: 101,
              startWorkingTime: dayjs.utc(`2024-01-15T09:00:00.000Z`),
              endWorkingTime: dayjs.utc(`2024-01-15T17:00:00.000Z`),
            }),
          ],
        },
      ];

      const result = normalizeBlockedTimesForEmployees([], periodWithDays);

      expect(result.length).toBe(0);
    });

    it(`should still normalize specific time blocks even when period is empty`, () => {
      // Note: Non-all-day blocks don't check if day/employee is in period
      // This is intentional - they are normalized anyway and filtered later
      const blockedTimes: EmployeeBlockedTimeData[] = [
        {
          id: 1,
          employeeId: 101,
          groupId: null,
          blockedDate: new Date(`2024-01-14T23:00:00.000Z`) as any,
          startTime: `12:00:00` as Time_HH_MM_SS_Type,
          endTime: `14:00:00` as Time_HH_MM_SS_Type,
          isAllDay: false,
          createdAt: `2024-01-01T00:00:00.000Z`,
          updatedAt: `2024-01-01T00:00:00.000Z`,
        },
      ];

      const result = normalizeBlockedTimesForEmployees(blockedTimes, []);

      // Specific time blocks are normalized regardless of period
      expect(result.length).toBe(1);
      expect(result[0].employeeId).toBe(101);
      expect(result[0].date).toBe(`2024-01-15`);
    });
  });
});
