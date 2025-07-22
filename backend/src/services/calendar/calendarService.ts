import {
  combinePeriodWithNormalizedAppointments,
  normalizeSavedAppointments,
  normalizeGoogleCalendarEvents,
  generateTimeSlotsFromAvailableTimes,
  generateGroupedTimeSlots,
  PeriodWithGroupedTimeslotsType,
  getPeriodWithDaysAndEmployeeAvailability,
  PeriodWithClearedDaysType,
  combineAndFilterTimeSlotsDataFromTwoServices,
  generateGroupedTimeSlotsForTwoServices,
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

// const getGroupedTimeSlots = async (dbPool: Pool, paramDate: Date_ISO_Type, serviceId: number, employeeIds: number[]): Promise<PeriodWithGroupedTimeslotsType[]> => {
const getGroupedTimeSlots = async (dbPool: Pool, paramDate: Date_ISO_Type, servicesData: {serviceId:number, employeeIds: number[]}[]): Promise<PeriodWithGroupedTimeslotsType[]> => {
  let periodWithClearedDaysForFirstService: PeriodWithClearedDaysType[] = [];
  let periodWithClearedDaysForSecondService: PeriodWithClearedDaysType[] = [];

  for (const [index, serviceData] of servicesData.entries()) {
    const serviceId = serviceData.serviceId;
    const employeeIds = serviceData.employeeIds;

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
      serviceDurationWithBuffer,
      service.durationTime,
      serviceId,
    );
    console.log(`\x1b[31m========================\x1b[0m`);
    console.log(`periodWithClearedDays: ${index}`, JSON.stringify(periodWithClearedDays, null, 4));

    if (index === 0) {
      periodWithClearedDaysForFirstService = periodWithClearedDays;
    } else {
      periodWithClearedDaysForSecondService = periodWithClearedDays;
    }
  }

  // console.log(`\x1b[31m========================\x1b[0m`);
  // console.log(`periodWithClearedDaysForFirstService: `, JSON.stringify(periodWithClearedDaysForFirstService, null, 4));
  // console.log(`periodWithClearedDaysForSecondService: `, JSON.stringify(periodWithClearedDaysForSecondService, null, 4));
  // console.log(`\x1b[31m========================\x1b[0m`);

  // const timeSlotsData = generateTimeSlotsFromAvailableTimes(periodWithClearedDays);
  // console.log(`\x1b[32m========================\x1b[0m`);
  // console.log(`timeSlotsData: `, JSON.stringify(timeSlotsData, null, 4));

  const timeSlotsDataForFirstService = generateTimeSlotsFromAvailableTimes(periodWithClearedDaysForFirstService);
  console.log(`\x1b[32m========================\x1b[0m`);
  console.log(`timeSlotsDataForFirstService: `, JSON.stringify(timeSlotsDataForFirstService, null, 4));

  const timeSlotsDataForSecondService = generateTimeSlotsFromAvailableTimes(periodWithClearedDaysForSecondService);
  console.log(`\x1b[32m========================\x1b[0m`);
  console.log(`timeSlotsDataForSecondService: `, JSON.stringify(timeSlotsDataForSecondService, null, 4));

    // Всегда используем новую функцию generateGroupedTimeSlotsForTwoServices
  let filteredTimeSlotsDataForTwoServices;

  if (servicesData.length === 1) {
        // Для одного сервиса конвертируем данные первого сервиса в формат для двух сервисов
    // но без второго сервиса
    filteredTimeSlotsDataForTwoServices = timeSlotsDataForFirstService.map(dayData => ({
      day: dayData.day,
      availableTimeSlots: dayData.employees.flatMap(employee =>
        employee.availableTimeSlots.map(slot => ({
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          employeeIds: [employee.employeeId]
          // secondService не добавляем для одного сервиса
        }))
      )
    }));
    console.log(`\x1b[32m Single service data converted for grouping: ${JSON.stringify(filteredTimeSlotsDataForTwoServices, null, 4)
    }\x1b[0m`,);
  } else if (servicesData.length === 2) {
    // Для двух сервисов используем комбинирование
    filteredTimeSlotsDataForTwoServices = combineAndFilterTimeSlotsDataFromTwoServices(timeSlotsDataForFirstService, timeSlotsDataForSecondService);
    console.log(`\x1b[32m filteredTimeSlotsDataForTwoServices: ${JSON.stringify(filteredTimeSlotsDataForTwoServices, null, 4)
    }\x1b[0m`,);
  } else {
    // Для других случаев возвращаем пустой массив
    console.log(`\x1b[31mUnsupported number of services: ${servicesData.length}\x1b[0m`);
    return [];
  }

  const groupedTimeSlotsForTwoServices = generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsDataForTwoServices);
  console.log(`\x1b[33m========================\x1b[0m`);
  console.log(`groupedTimeSlotsForTwoServices: `, JSON.stringify(groupedTimeSlotsForTwoServices, null, 4));

  return groupedTimeSlotsForTwoServices;
}

export { getGroupedTimeSlots };
