import { describe, it, expect, beforeEach } from '@jest/globals';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import {
  calculateAvailableTimeSlots,
} from './calendarUtils.adapter';
import type {
  GroupedAvailabilityDayType,
  AppointmentDataType,
  EmployeeBlockedTimeData,
} from '../calendarService';

dayjs.extend(utc);
dayjs.extend(timezone);

describe(`Calendar Service Simple Integration Tests`, () => {
  beforeEach(() => {
    // Set timezone to Europe/Berlin for consistent testing
    dayjs.tz.setDefault(`Europe/Berlin`);
  });

  describe(`Basic Functionality Test`, () => {
    it(`should generate available time slots for a simple scenario`, () => {
      // Test data for a simple scenario
      const testDate = `2025-10-20`;
      const currentTimeMs = dayjs(`2025-10-09T11:11:04.944Z`).valueOf();

      // Employee working day data - Monday (dayId = 1)
      const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
        {
          dayId: 1, // Monday
          employees: [
            {
              id: 15,
              startTime: `08:00:00`,
              endTime: `18:00:00`,
              blockStartTimeFirst: null, // No pause time
              blockEndTimeFirst: null,
              advanceBookingTime: `00:00:00`,
              timeslotInterval: 30,
            },
          ],
        },
      ];

      // No appointments
      const savedAppointments: AppointmentDataType[] = [];
      const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];
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
      expect(result.period).toBeDefined();
      expect(result.dayAvailability).toBeDefined();
      expect(result.groupedTimeSlots).toBeDefined();

      // Verify day availability structure
      expect(result.dayAvailability).toHaveLength(1); // 1 day
      expect(result.dayAvailability[0].employees).toHaveLength(1); // 1 employee

      const employeeAvailability = result.dayAvailability[0].employees[0];
      expect(employeeAvailability.employeeId).toBe(15);
      expect(employeeAvailability.availableTimes).toBeDefined();

      // Should have available times since there are no blocking factors
      expect(employeeAvailability.availableTimes.length).toBeGreaterThan(0);
    });

    it(`should block time slots when there are appointments`, () => {
      // Test data with an appointment that should block time
      const testDate = `2025-10-20`;
      const currentTimeMs = dayjs(`2025-10-09T11:11:04.944Z`).valueOf();

      // Employee working day data - Monday (dayId = 1)
      const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
        {
          dayId: 1, // Monday
          employees: [
            {
              id: 15,
              startTime: `08:00:00`,
              endTime: `18:00:00`,
              blockStartTimeFirst: null,
              blockEndTimeFirst: null,
              advanceBookingTime: `00:00:00`,
              timeslotInterval: 30,
            },
          ],
        },
      ];

      // Appointment that blocks 10:00-12:00
      const savedAppointments: AppointmentDataType[] = [
        {
          id: 1,
          date: `2025-10-20`,
          createdDate: `2025-10-09T10:00:00.000Z`,
          serviceName: `Test Service`,
          timeStart: `10:00:00`,
          timeEnd: `12:00:00`,
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

      const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];
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

      // The appointment (10:00-12:00) should block that time period
      // We should have available times before 10:00 and after 12:00

      // Check if we have available times before the appointment
      const beforeAppointment = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() < 10; // Before 10:00
      });

      // Check if we have available times after the appointment
      const afterAppointment = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        return startTime.hour() >= 12; // After 12:00
      });

      // Should have available times either before or after the appointment
      expect(beforeAppointment.length + afterAppointment.length).toBeGreaterThan(0);

      // Verify that no available times overlap with the appointment (10:00-12:00)
      const overlappingTimes = employeeAvailability.availableTimes.filter(availableTime => {
        const startTime = dayjs.utc(availableTime.minPossibleStartTimeMs).tz(`Europe/Berlin`);
        const endTime = dayjs.utc(availableTime.maxPossibleStartTimeMs).tz(`Europe/Berlin`);

        // Check if available time overlaps with 10:00-12:00
        return (startTime.hour() < 12 && endTime.hour() > 10) ||
               (startTime.hour() === 10 && startTime.minute() < 0) ||
               (endTime.hour() === 12 && endTime.minute() > 0);
      });

      expect(overlappingTimes).toHaveLength(0); // No overlapping times should exist
    });
  });
});
