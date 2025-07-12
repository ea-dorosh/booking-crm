import {
  combinePeriodWithNormalizedAppointments,
  normalizeSavedAppointments,
  normalizeGoogleCalendarEvents,
  generateTimeSlotsFromAvailableTimes,
  generateGroupedTimeSlots,
  PeriodWithGroupedTimeslotsType,
  getPeriodWithDaysAndEmployeeAvailability,
} from '@/services/calendar/calendarUtils.js';
import { AppointmentDataType } from '@/@types/appointmentsTypes.js';
import { AppointmentStatusEnum } from '@/enums/enums.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getAppointmentsForCalendar } from '@/services/appointment/appointmentService.js';
import { getGoogleCalendarEventsForSpecificDates } from '@/services/googleCalendar/googleCalendarService.js';
import { getGroupEmployeeAvailability } from '@/services/employees/employeesService.js';
import { getService } from '@/services/service/serviceService.js';
import { getServiceDuration } from '@/utils/timeUtils.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Pool } from 'mysql2/promise';

const DATE_FORMAT = `YYYY-MM-DD`;

const getGroupedTimeSlots = async (dbPool: Pool, paramDate: Date_ISO_Type, serviceId: number, employeeIds: number[]): Promise<PeriodWithGroupedTimeslotsType[]> => {
  const service = await getService(dbPool, serviceId);
  const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);
  const groupedEmployeeAvailability = await getGroupEmployeeAvailability(dbPool, employeeIds);

  console.log(`\x1b[31m========================\x1b[0m`);
  console.log(`groupedEmployeeAvailability: `, JSON.stringify(groupedEmployeeAvailability, null, 4));

  const periodWithDaysAndEmployeeAvailability = getPeriodWithDaysAndEmployeeAvailability(paramDate, groupedEmployeeAvailability);
  console.log(`\x1b[31m========================\x1b[0m`);
  console.log(`periodWithDaysAndEmployeeAvailability: `, JSON.stringify(periodWithDaysAndEmployeeAvailability, null, 4));

  let savedAppointments: AppointmentDataType[] = [];

  if (periodWithDaysAndEmployeeAvailability.length > 0) {
    savedAppointments = await getAppointmentsForCalendar(
      dbPool,
      periodWithDaysAndEmployeeAvailability.map(dayInPeriod => dayInPeriod.day),
      employeeIds,
      AppointmentStatusEnum.Active
    );
  }
  console.log(`\x1b[31m========================\x1b[0m`);
  console.log(`savedAppointments: `, JSON.stringify(savedAppointments, null, 4));

  const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];

  if (periodWithDaysAndEmployeeAvailability.length > 0) {
    console.log(`Loading Google Calendar events for specific employees and days`);

    const employeeDatesMap = new Map<number, string[]>();

    periodWithDaysAndEmployeeAvailability.forEach(dayData => {
      dayData.employees.forEach(employee => {
        if (!employeeDatesMap.has(employee.employeeId)) {
          employeeDatesMap.set(employee.employeeId, []);
        }
        employeeDatesMap.get(employee.employeeId)!.push(dayData.day);
      });
    });
    console.log(`Employee dates map:`, Object.fromEntries(employeeDatesMap));

    for (const [employeeId, dates] of employeeDatesMap) {
      try {
        const employeeGoogleEvents = await getGoogleCalendarEventsForSpecificDates(
          dbPool,
          employeeId,
          dates as Date_ISO_Type[]
        );

        if (employeeGoogleEvents && employeeGoogleEvents.length > 0) {
          console.log(`Found ${employeeGoogleEvents.length} Google Calendar events for employee ${employeeId} on dates: ${dates.join(', ')}`);
          googleCalendarEvents.push(...employeeGoogleEvents);
        }
      } catch (error) {
        console.error(`Error loading Google Calendar events for employee ${employeeId}:`, error);
      }
    }
  }

  const normalizedSavedAppointments = normalizeSavedAppointments(savedAppointments);

  const normalizedGoogleEvents: any[] = [];

  if (periodWithDaysAndEmployeeAvailability.length > 0) {
    const employeeDatesMapForNormalization = new Map<number, string[]>();

    periodWithDaysAndEmployeeAvailability.forEach(dayData => {
      dayData.employees.forEach(employee => {
        if (!employeeDatesMapForNormalization.has(employee.employeeId)) {
          employeeDatesMapForNormalization.set(employee.employeeId, []);
        }
        employeeDatesMapForNormalization.get(employee.employeeId)!.push(dayData.day);
      });
    });

    for (const [employeeId, dates] of employeeDatesMapForNormalization) {
      const employeeGoogleEvents = googleCalendarEvents.filter(event => {
        const eventDate = dayjs(event.start).format(DATE_FORMAT);
        return dates.includes(eventDate);
      });

      if (employeeGoogleEvents.length > 0) {
        const normalizedEvents = normalizeGoogleCalendarEvents(employeeGoogleEvents, employeeId);
        normalizedGoogleEvents.push(...normalizedEvents);
      }
    }
  }

  const allNormalizedAppointments = [...normalizedSavedAppointments, ...normalizedGoogleEvents];

  console.log(`Total normalized appointments (saved appointments + Google events): ${allNormalizedAppointments.length}`);
  console.log(`Normalized saved appointments: ${normalizedSavedAppointments.length}`);
  console.log(`Normalized Google Calendar events: ${normalizedGoogleEvents.length}`);

  const periodWithClearedDays = combinePeriodWithNormalizedAppointments(
    periodWithDaysAndEmployeeAvailability,
    allNormalizedAppointments,
    serviceDurationWithBuffer
  );
  console.log(`\x1b[31m========================\x1b[0m`);
  console.log(`periodWithClearedDays: `, JSON.stringify(periodWithClearedDays, null, 4));

  const timeSlotsData = generateTimeSlotsFromAvailableTimes(periodWithClearedDays);
  console.log(`\x1b[32m========================\x1b[0m`);
  console.log(`timeSlotsData: `, JSON.stringify(timeSlotsData, null, 4));

  const groupedTimeSlots = generateGroupedTimeSlots(timeSlotsData);
  console.log(`\x1b[33m========================\x1b[0m`);
  console.log(`groupedTimeSlots: `, JSON.stringify(groupedTimeSlots, null, 4));

  return groupedTimeSlots;
}

export { getGroupedTimeSlots };
