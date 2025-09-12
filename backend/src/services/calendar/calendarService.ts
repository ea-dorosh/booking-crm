import {
  combinePeriodWithNormalizedAppointments,
  normalizeSavedAppointments,
  normalizeGoogleEventsForEmployees,
  generateTimeSlotsFromAvailableTimes,
  PeriodWithGroupedTimeslotsType,
  getPeriodWithDaysAndEmployeeAvailability,
  PeriodWithClearedDaysType,
  combineAndFilterTimeSlotsDataFromTwoServices,
  generateGroupedTimeSlotsForTwoServices,
  PeriodWithEmployeeWorkingTimeType,
  EmployeeWithWorkingTimesType,
  normalizePauseTimesForEmployees,
} from '@/services/calendar/calendarUtils.js';
import { AppointmentDataType } from '@/@types/appointmentsTypes.js';
import { AppointmentStatusEnum } from '@/enums/enums.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getAppointmentsForCalendar } from '@/services/appointment/appointmentService.js';
import { getGoogleCalendarEventsForSpecificDates } from '@/services/googleCalendar/googleCalendarService.js';
// Legacy availability removed
import { getService } from '@/services/service/serviceService.js';
import { getServiceDuration } from '@/utils/timeUtils.js';
import { Pool } from 'mysql2/promise';
// import { dayjs } from '@/services/dayjs/dayjsService.js';
import { buildGroupedAvailabilityForWeek } from '@/services/calendar/schedulePeriodsAvailabilityService.js';

/**
 * Get grouped time slots for one or two services
 * @param dbPool - Database connection pool
 * @param paramDate - Date to get time slots for
 * @param servicesData - Array of service data (serviceId and employeeIds)
 * @returns Promise with grouped time slots
 */
const getGroupedTimeSlots = async (
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  servicesData: { serviceId: number; employeeIds: number[] }[],
): Promise<PeriodWithGroupedTimeslotsType[]> => {

  if (servicesData.length === 0 || servicesData.length > 2) {
    throw new Error(`Unsupported number of services: ${servicesData.length}. Only 1 or 2 services are supported.`);
  }

  let periodWithClearedDaysForFirstService: PeriodWithClearedDaysType[] = [];
  let periodWithClearedDaysForSecondService: PeriodWithClearedDaysType[] = [];

  // Process each service
  for (const [index, serviceData] of servicesData.entries()) {
    const {
      serviceId, employeeIds,
    } = serviceData;

    // Get service details and employee availability
    const service = await getService(dbPool, serviceId);
    const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);

    const groupedByDay = await buildGroupedAvailabilityForWeek(dbPool, paramDate, employeeIds);
    const periodWithDaysAndEmployeeAvailability = getPeriodWithDaysAndEmployeeAvailability(paramDate, groupedByDay);

    console.log(`periodWithDaysAndEmployeeAvailability: `, JSON.stringify(periodWithDaysAndEmployeeAvailability, null, 2));

    // Get saved appointments if there are working days
    let savedAppointments: AppointmentDataType[] = [];
    if (periodWithDaysAndEmployeeAvailability.length > 0) {
      savedAppointments = await getAppointmentsForCalendar(
        dbPool,
        periodWithDaysAndEmployeeAvailability.map(dayInPeriod => dayInPeriod.day),
        employeeIds,
        AppointmentStatusEnum.Active,
      );
    }

    // Get Google Calendar events
    const googleCalendarEvents = await getGoogleCalendarEventsForEmployees(
      dbPool,
      periodWithDaysAndEmployeeAvailability,
    );

    // Normalize all appointments
    const normalizedSavedAppointments = normalizeSavedAppointments(savedAppointments);
    const normalizedGoogleEvents = normalizeGoogleEventsForEmployees(
      googleCalendarEvents,
      periodWithDaysAndEmployeeAvailability,
    );

    const normalizedPauseTimes = normalizePauseTimesForEmployees(periodWithDaysAndEmployeeAvailability);
    const allNormalizedAppointments = [
      ...normalizedSavedAppointments,
      ...normalizedGoogleEvents,
      ...normalizedPauseTimes,
    ];

    // Calculate available time slots
    const periodWithClearedDays = combinePeriodWithNormalizedAppointments(
      periodWithDaysAndEmployeeAvailability,
      allNormalizedAppointments,
      serviceDurationWithBuffer,
      service.durationTime,
      serviceId,
    );

    // Store cleared days for each service
    if (index === 0) {
      periodWithClearedDaysForFirstService = periodWithClearedDays;
    } else {
      periodWithClearedDaysForSecondService = periodWithClearedDays;
    }
  }
  console.log(`periodWithClearedDaysForFirstService: `, JSON.stringify(periodWithClearedDaysForFirstService, null, 2));
  // Generate time slots
  const timeSlotsDataForFirstService = generateTimeSlotsFromAvailableTimes(periodWithClearedDaysForFirstService);

  console.log(`timeSlotsDataForFirstService: `, JSON.stringify(timeSlotsDataForFirstService, null, 2));
  const timeSlotsDataForSecondService = generateTimeSlotsFromAvailableTimes(periodWithClearedDaysForSecondService);
  console.log(`timeSlotsDataForSecondService: `, JSON.stringify(timeSlotsDataForSecondService, null, 2));

  // Process based on number of services
  let filteredTimeSlotsDataForTwoServices;

  if (servicesData.length === 1) {
    // Convert single service data to two-services format without secondService
    filteredTimeSlotsDataForTwoServices = timeSlotsDataForFirstService.map(dayData => ({
      day: dayData.day,
      availableTimeSlots: dayData.employees.flatMap(employee =>
        employee.availableTimeSlots.map(slot => ({
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          employeeIds: [employee.employeeId],
          serviceId: dayData.serviceId,
        })),
      ),
    }));
  } else {
    // Combine two services
    filteredTimeSlotsDataForTwoServices = combineAndFilterTimeSlotsDataFromTwoServices(
      timeSlotsDataForFirstService,
      timeSlotsDataForSecondService,
    );
  }

  // Group and return final result
  return generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsDataForTwoServices);
};

/**
 * Get Google Calendar events for specific employees and days
 */
async function getGoogleCalendarEventsForEmployees(
  dbPool: Pool,
  periodWithDaysAndEmployeeAvailability: PeriodWithEmployeeWorkingTimeType[],
): Promise<{ start: string; end: string; summary: string }[]> {
  const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];

  if (periodWithDaysAndEmployeeAvailability.length === 0) {
    return googleCalendarEvents;
  }

  // Create employee dates map
  const employeeDatesMap = new Map<number, string[]>();
  periodWithDaysAndEmployeeAvailability.forEach(dayData => {
    dayData.employees.forEach((employee: EmployeeWithWorkingTimesType) => {
      if (!employeeDatesMap.has(employee.employeeId)) {
        employeeDatesMap.set(employee.employeeId, []);
      }
      employeeDatesMap.get(employee.employeeId)!.push(dayData.day);
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
      // Log error but don't fail the entire request
      console.error(`Error loading Google Calendar events for employee ${employeeId}:`, error);
    }
  }

  return googleCalendarEvents;
}

export { getGroupedTimeSlots };
