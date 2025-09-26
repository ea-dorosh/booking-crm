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
import bookingLogger from '@/services/logger/loggerService.js';

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
  const startTime = Date.now();
  const operationId = `calendar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const logContext = {
    operationId,
    paramDate,
    servicesData,
    servicesCount: servicesData.length,
  };

  bookingLogger.info(`Calendar time slots generation started`, logContext);

  try {
    if (servicesData.length === 0 || servicesData.length > 2) {
      const errorMessage = `Unsupported number of services: ${servicesData.length}. Only 1 or 2 services are supported.`;
      bookingLogger.calendarError(errorMessage, {
        ...logContext,
        validationError: `invalid_services_count`,
      });
      throw new Error(errorMessage);
    }

    let periodWithClearedDaysForFirstService: PeriodWithClearedDaysType[] = [];
    let periodWithClearedDaysForSecondService: PeriodWithClearedDaysType[] = [];

    // Process each service
    for (const [index, serviceData] of servicesData.entries()) {
      const serviceStartTime = Date.now();
      const {
        serviceId, employeeIds,
      } = serviceData;

      const serviceLogContext = {
        ...logContext,
        serviceIndex: index,
        serviceId,
        employeeIds,
      };

      bookingLogger.debug(`Processing service ${index + 1}/${servicesData.length}`, serviceLogContext);

      try {
        // Get service details and employee availability
        const service = await getService(dbPool, serviceId);
        if (!service) {
          throw new Error(`Service not found: ${serviceId}`);
        }

        const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);

        bookingLogger.debug(`Service details retrieved`, {
          ...serviceLogContext,
          serviceName: service.name,
          serviceDuration: service.durationTime,
          bufferTime: service.bufferTime,
          serviceDurationWithBuffer,
        });

        const groupedByDay = await buildGroupedAvailabilityForWeek(dbPool, paramDate, employeeIds);
        const periodWithDaysAndEmployeeAvailability = getPeriodWithDaysAndEmployeeAvailability(paramDate, groupedByDay);

        bookingLogger.debug(`Employee availability retrieved`, {
          ...serviceLogContext,
          availabilityDaysCount: periodWithDaysAndEmployeeAvailability.length,
          totalEmployeesAcrossDays: periodWithDaysAndEmployeeAvailability.reduce(
            (total, day) => total + day.employees.length, 0,
          ),
        });

        // Get saved appointments if there are working days
        let savedAppointments: AppointmentDataType[] = [];
        if (periodWithDaysAndEmployeeAvailability.length > 0) {
          const appointmentsStartTime = Date.now();
          savedAppointments = await getAppointmentsForCalendar(
            dbPool,
            periodWithDaysAndEmployeeAvailability.map(dayInPeriod => dayInPeriod.day),
            employeeIds,
            AppointmentStatusEnum.Active,
          );

          bookingLogger.debug(`Saved appointments retrieved`, {
            ...serviceLogContext,
            appointmentsCount: savedAppointments.length,
            retrievalTime: Date.now() - appointmentsStartTime,
          });
        }

        // Get Google Calendar events
        const googleCalendarStartTime = Date.now();
        const googleCalendarEvents = await getGoogleCalendarEventsForEmployees(
          dbPool,
          periodWithDaysAndEmployeeAvailability,
        );

        bookingLogger.debug(`Google Calendar events retrieved`, {
          ...serviceLogContext,
          googleEventsCount: googleCalendarEvents.length,
          retrievalTime: Date.now() - googleCalendarStartTime,
        });

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

        bookingLogger.debug(`Appointments normalized`, {
          ...serviceLogContext,
          savedAppointmentsCount: normalizedSavedAppointments.length,
          googleEventsCount: normalizedGoogleEvents.length,
          pauseTimesCount: normalizedPauseTimes.length,
          totalBlockedSlots: allNormalizedAppointments.length,
        });

        // Calculate available time slots
        const calculationStartTime = Date.now();
        const periodWithClearedDays = combinePeriodWithNormalizedAppointments(
          periodWithDaysAndEmployeeAvailability,
          allNormalizedAppointments,
          serviceDurationWithBuffer,
          service.durationTime,
          serviceId,
        );

        bookingLogger.debug(`Available time slots calculated`, {
          ...serviceLogContext,
          calculationTime: Date.now() - calculationStartTime,
          clearedDaysCount: periodWithClearedDays.length,
        });

        // Store cleared days for each service
        if (index === 0) {
          periodWithClearedDaysForFirstService = periodWithClearedDays;
        } else {
          periodWithClearedDaysForSecondService = periodWithClearedDays;
        }

        bookingLogger.debug(`Service ${index + 1} processed successfully`, {
          ...serviceLogContext,
          processingTime: Date.now() - serviceStartTime,
        });

      } catch (serviceError) {
        bookingLogger.calendarError(`Error processing service ${index + 1}`, {
          ...serviceLogContext,
          error: serviceError as Error,
          processingTime: Date.now() - serviceStartTime,
        });
        throw serviceError;
      }
    }
    // Generate time slots
    const timeSlotsGenerationStartTime = Date.now();
    const timeSlotsDataForFirstService = generateTimeSlotsFromAvailableTimes(periodWithClearedDaysForFirstService);

    bookingLogger.debug(`Time slots generated for first service`, {
      ...logContext,
      timeSlotsCount: timeSlotsDataForFirstService.reduce(
        (total, day) => total + day.employees.reduce((dayTotal, emp) => dayTotal + emp.availableTimeSlots.length, 0), 0,
      ),
      generationTime: Date.now() - timeSlotsGenerationStartTime,
    });

    const timeSlotsDataForSecondService = generateTimeSlotsFromAvailableTimes(periodWithClearedDaysForSecondService);

    if (servicesData.length === 2) {
      bookingLogger.debug(`Time slots generated for second service`, {
        ...logContext,
        timeSlotsCount: timeSlotsDataForSecondService.reduce(
          (total, day) => total + day.employees.reduce((dayTotal, emp) => dayTotal + emp.availableTimeSlots.length, 0), 0,
        ),
      });
    }

    // Process based on number of services
    const combinationStartTime = Date.now();
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

      bookingLogger.debug(`Single service time slots processed`, {
        ...logContext,
        totalSlots: filteredTimeSlotsDataForTwoServices.reduce(
          (total, day) => total + day.availableTimeSlots.length, 0,
        ),
        processingTime: Date.now() - combinationStartTime,
      });
    } else {
      // Combine two services
      filteredTimeSlotsDataForTwoServices = combineAndFilterTimeSlotsDataFromTwoServices(
        timeSlotsDataForFirstService,
        timeSlotsDataForSecondService,
      );

      bookingLogger.debug(`Two services combined`, {
        ...logContext,
        combinedSlots: filteredTimeSlotsDataForTwoServices.reduce(
          (total, day) => total + day.availableTimeSlots.length, 0,
        ),
        processingTime: Date.now() - combinationStartTime,
      });
    }

    // Group and return final result
    const groupingStartTime = Date.now();
    const finalResult = generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsDataForTwoServices);

    bookingLogger.info(`Calendar time slots generation completed`, {
      ...logContext,
      totalOperationTime: Date.now() - startTime,
      groupingTime: Date.now() - groupingStartTime,
      finalSlotsCount: finalResult.reduce(
        (total, day) => total + day.availableTimeslots.length, 0,
      ),
      daysWithSlots: finalResult.length,
    });

    return finalResult;

  } catch (error) {
    bookingLogger.calendarError(`Calendar time slots generation failed`, {
      ...logContext,
      error: error as Error,
      totalOperationTime: Date.now() - startTime,
    });
    throw error;
  }
};

/**
 * Get Google Calendar events for specific employees and days
 */
async function getGoogleCalendarEventsForEmployees(
  dbPool: Pool,
  periodWithDaysAndEmployeeAvailability: PeriodWithEmployeeWorkingTimeType[],
): Promise<{ start: string; end: string; summary: string }[]> {
  const startTime = Date.now();
  const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];

  const logContext = {
    operation: `get_google_calendar_events`,
    availabilityDaysCount: periodWithDaysAndEmployeeAvailability.length,
  };

  bookingLogger.debug(`Getting Google Calendar events for employees`, logContext);

  if (periodWithDaysAndEmployeeAvailability.length === 0) {
    bookingLogger.debug(`No availability days provided, skipping Google Calendar events`, logContext);
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

  bookingLogger.debug(`Employee dates map created`, {
    ...logContext,
    employeesCount: employeeDatesMap.size,
    totalEmployeeDaysCombinations: Array.from(employeeDatesMap.values()).reduce((total, dates) => total + dates.length, 0),
  });

  // Get events for each employee
  let totalEventsRetrieved = 0;
  let failedEmployees = 0;

  for (const [employeeId, dates] of employeeDatesMap) {
    const employeeStartTime = Date.now();
    try {
      bookingLogger.debug(`Fetching Google Calendar events for employee`, {
        ...logContext,
        employeeId,
        datesCount: dates.length,
        dates: dates,
      });

      const employeeGoogleEvents = await getGoogleCalendarEventsForSpecificDates(
        dbPool,
        employeeId,
        dates as Date_ISO_Type[],
      );

      if (employeeGoogleEvents && employeeGoogleEvents.length > 0) {
        googleCalendarEvents.push(...employeeGoogleEvents);
        totalEventsRetrieved += employeeGoogleEvents.length;

        bookingLogger.debug(`Google Calendar events retrieved for employee`, {
          ...logContext,
          employeeId,
          eventsCount: employeeGoogleEvents.length,
          retrievalTime: Date.now() - employeeStartTime,
        });
      } else {
        bookingLogger.debug(`No Google Calendar events found for employee`, {
          ...logContext,
          employeeId,
          retrievalTime: Date.now() - employeeStartTime,
        });
      }
    } catch (error) {
      failedEmployees++;
      bookingLogger.googleCalendar(`Error loading Google Calendar events for employee`, {
        ...logContext,
        employeeId,
        error: error as Error,
        retrievalTime: Date.now() - employeeStartTime,
      });
    }
  }

  bookingLogger.debug(`Google Calendar events retrieval completed`, {
    ...logContext,
    totalEventsRetrieved,
    failedEmployees,
    successfulEmployees: employeeDatesMap.size - failedEmployees,
    totalRetrievalTime: Date.now() - startTime,
  });

  return googleCalendarEvents;
}

export { getGroupedTimeSlots };
