import { describe, it, expect, beforeEach } from '@jest/globals';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import {
  calculateAvailableTimeSlots,
  type EmployeeWorkingDayPure,
  type NormalizedAppointmentPure,
  type BlockedTimePure,
  type PauseTimePure,
} from './calendarUtils.adapter';
import type {
  GroupedAvailabilityDayType,
  AppointmentDataType,
  EmployeeBlockedTimeData,
} from './calendarService.js';

dayjs.extend(utc);
dayjs.extend(timezone);

describe(`Calendar Service Integration Tests`, () => {
  beforeEach(() => {
    // Set timezone to Europe/Berlin for consistent testing
    dayjs.tz.setDefault(`Europe/Berlin`);
  });

  describe(`Real World Test Case 1: serviceId=43, employeeIds=[15], date=2025-10-20`, () => {
    it(`should generate correct time slots with proper blocking logic`, () => {
      // Test data based on real production scenario
      const testDate = `2025-10-20`;
      const serviceId = 43;
      const employeeIds = [15];
      const currentTimeMs = dayjs(`2025-10-09T11:11:04.944Z`).valueOf(); // Current time from logs

      // Employee working day data (from logs) - using GroupedAvailabilityDayType format
      // 2025-10-20 is a Monday (dayId = 1)
      const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
        {
          dayId: 1, // Monday
          employees: [
            {
              id: 15,
              startTime: `08:00:00`,
              endTime: `18:00:00`,
              blockStartTimeFirst: `11:00:00`, // Pause time start
              blockEndTimeFirst: `11:30:00`,   // Pause time end
              advanceBookingTime: `00:00:00`,
              timeslotInterval: 30,
            },
          ],
        },
      ];

      // Saved appointment (from logs) - 08:45-10:45 Berlin
      const savedAppointments: AppointmentDataType[] = [
        {
          id: 1,
          date: `2025-10-20`,
          createdDate: `2025-10-09T10:00:00.000Z`,
          serviceName: `Test Service`,
          timeStart: `08:45:00`,
          timeEnd: `10:45:00`,
          serviceDuration: 120, // 2 hours in minutes
          customerLastName: `Test`,
          customerFirstName: `Customer`,
          status: `confirmed` as any,
          customer: {
            id: 1,
            firstName: `Customer`,
            lastName: `Test`,
            isCustomerNew: false,
          },
          employee: {
            id: 15,
            firstName: `Test`,
            lastName: `Employee`,
          },
        },
      ];

      // Google Calendar event (from logs) - 13:15-13:40 Berlin
      const googleCalendarEvents: { start: string; end: string; summary: string }[] = [
        {
          start: `2025-10-20T13:15:00.000Z`,
          end: `2025-10-20T13:40:00.000Z`,
          summary: `Test Event`,
        },
      ];

      // No blocked times for this test case
      const blockedTimesFromDB: EmployeeBlockedTimeData[] = [];

      // Service duration: 1 hour (from logs)
      const serviceDuration = `01:00:00`;

      // Calculate available time slots
      const result = calculateAvailableTimeSlots(
        testDate,
        groupedEmployeeAvailability,
        savedAppointments,
        blockedTimesFromDB,
        googleCalendarEvents,
        serviceDuration,
        currentTimeMs,
      );

      // Verify the result structure
      expect(result).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.dayAvailability).toBeDefined();
      expect(result.groupedTimeSlots).toBeDefined();

      // Verify day availability structure
      expect(result.dayAvailability).toHaveLength(1); // 1 day
      expect(result.dayAvailability[0].employees).toHaveLength(1); // 1 employee

      const employeeAvailability = result.dayAvailability[0].employees[0];
      expect(employeeAvailability.employeeId).toBe(15);
      expect(employeeAvailability.availableTimes).toBeDefined();
      expect(employeeAvailability.availableTimes.length).toBeGreaterThan(0);

      // Verify that morning slots (08:00-10:45) are blocked by saved appointment
      const morningAvailableTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() < 11; // Before 11:00 Berlin time
      });
      expect(morningAvailableTimes).toHaveLength(0); // No morning available times should exist

      // Verify that pause time (11:00-11:30) is blocked
      const pauseTimeAvailableTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() === 11 && startTime.minute() < 30; // 11:00-11:30 Berlin time
      });
      expect(pauseTimeAvailableTimes).toHaveLength(0); // No pause time available times should exist

      // Verify that Google Calendar event (13:15-13:40) is blocked
      const googleEventAvailableTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() === 13 && startTime.minute() >= 15 && startTime.minute() < 40; // 13:15-13:40 Berlin time
      });
      expect(googleEventAvailableTimes).toHaveLength(0); // No Google event available times should exist

      // Verify that we have available times after the Google event (13:40+)
      const afternoonAvailableTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() >= 13 && startTime.minute() >= 40; // 13:40+ Berlin time
      });
      expect(afternoonAvailableTimes.length).toBeGreaterThan(0); // Should have afternoon available times

      // Verify that we have the expected number of available time periods
      expect(employeeAvailability.availableTimes).toHaveLength(2); // Should have 2 available time periods

      // Verify the first available time period (09:30-12:15)
      const firstAvailableTime = employeeAvailability.availableTimes[0];
      const firstStartTime = dayjs.utc(firstAvailableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
      const firstEndTime = dayjs.utc(firstAvailableTime.maxPossibleStartTimeMs).tz(`Europe/Berlin`);
      expect(firstStartTime.format(`HH:mm:ss`)).toBe(`11:30:00`);
      expect(firstEndTime.format(`HH:mm:ss`)).toBe(`14:15:00`);

      // Verify the second available time period (13:40-15:00)
      const secondAvailableTime = employeeAvailability.availableTimes[1];
      const secondStartTime = dayjs.utc(secondAvailableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
      const secondEndTime = dayjs.utc(secondAvailableTime.maxPossibleStartTimeMs).tz(`Europe/Berlin`);
      expect(secondStartTime.format(`HH:mm:ss`)).toBe(`15:40:00`);
      expect(secondEndTime.format(`HH:mm:ss`)).toBe(`17:00:00`);
    });

    it(`should handle 2025-10-21 with blocked time correctly`, () => {
      // Test data for 2025-10-21 with blocked time
      const testDate = `2025-10-21`;
      const serviceId = 43;
      const employeeIds = [15];
      const currentTimeMs = dayjs(`2025-10-09T11:11:04.944Z`).valueOf();

      // Employee working day data for 2025-10-21 (from logs) - using GroupedAvailabilityDayType format
      // 2025-10-21 is a Tuesday (dayId = 2)
      const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
        {
          dayId: 2, // Tuesday
          employees: [
            {
              id: 15,
              startTime: `06:00:00`,
              endTime: `19:00:00`,
              blockStartTimeFirst: `12:20:00`, // Pause time start
              blockEndTimeFirst: `12:40:00`,   // Pause time end
              advanceBookingTime: `00:00:00`,
              timeslotInterval: 30,
            },
          ],
        },
      ];

      // Saved appointment for 2025-10-21 (from logs) - 15:00-15:30 Berlin
      const savedAppointments: AppointmentDataType[] = [
        {
          id: 2,
          date: `2025-10-21`,
          createdDate: `2025-10-09T10:00:00.000Z`,
          serviceName: `Test Service`,
          timeStart: `15:00:00`,
          timeEnd: `15:30:00`,
          serviceDuration: 30, // 30 minutes
          customerLastName: `Test`,
          customerFirstName: `Customer`,
          status: `confirmed` as any,
          customer: {
            id: 2,
            firstName: `Customer`,
            lastName: `Test`,
            isCustomerNew: false,
          },
          employee: {
            id: 15,
            firstName: `Test`,
            lastName: `Employee`,
          },
        },
      ];

      // No Google Calendar events for 2025-10-21
      const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];

      // No blocked times for this test case
      const blockedTimesFromDB: EmployeeBlockedTimeData[] = [];

      // Service duration: 1 hour
      const serviceDuration = `01:00:00`;

      // Calculate available time slots
      const result = calculateAvailableTimeSlots(
        testDate,
        groupedEmployeeAvailability,
        savedAppointments,
        blockedTimesFromDB,
        googleCalendarEvents,
        serviceDuration,
        currentTimeMs,
      );

      // Verify the result structure
      expect(result).toBeDefined();
      expect(result.dayAvailability).toHaveLength(1); // 1 day
      expect(result.dayAvailability[0].employees).toHaveLength(1); // 1 employee

      const employeeAvailability = result.dayAvailability[0].employees[0];
      expect(employeeAvailability.employeeId).toBe(15);
      expect(employeeAvailability.availableTimes).toBeDefined();

      // Verify that we have available times before the pause (06:00-12:20)
      const morningAvailableTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() < 12 || (startTime.hour() === 12 && startTime.minute() < 20);
      });
      expect(morningAvailableTimes.length).toBeGreaterThan(0);

      // Verify that pause time (12:20-12:40) is blocked
      const pauseTimeAvailableTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() === 12 && startTime.minute() >= 20 && startTime.minute() < 40;
      });
      expect(pauseTimeAvailableTimes).toHaveLength(0);

      // Verify that saved appointment (15:00-15:30) is blocked
      const appointmentAvailableTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() === 15 && startTime.minute() < 30;
      });
      expect(appointmentAvailableTimes).toHaveLength(0);

      // Verify that we have available times after the appointment (15:30+)
      const afternoonAvailableTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() > 15 || (startTime.hour() === 15 && startTime.minute() >= 30);
      });
      expect(afternoonAvailableTimes.length).toBeGreaterThan(0);

      // Verify expected number of available time periods (3 periods from logs)
      expect(employeeAvailability.availableTimes).toHaveLength(3);
    });
  });
});
