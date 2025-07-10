import express from 'express';
import url from 'url';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import {
  addTimeSlotsAccordingEmployeeAvailability,
  disableTimeSlotsForServiceDuration,
  replaceExistingDayWithNewEmployeeData,
  combinePeriodWithSavedAppointments,
  combinePeriodWithNormalizedAppointments,
  normalizeSavedAppointments,
  normalizeGoogleCalendarEvents,
  generateTimeSlotsFromAvailableTimes,
  generateGroupedTimeSlots,
  PeriodWithGroupedTimeslotsType,
} from '@/routes/calendar/calendarUtils.js';
import { getServiceDuration } from '@/utils/timeUtils.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { getService } from '@/services/service/serviceService.js';
import { getGoogleCalendarEvents, getGoogleCalendarEventsForSpecificDates } from '@/services/googleCalendar/googleCalendarService.js';
import { AppointmentStatusEnum } from '@/enums/enums.js';
import { getEmployeeAvailability, getGroupEmployeeAvailability } from '@/services/employees/employeesService.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getDatesPeriod, getPeriodWithDaysAndEmployeeAvailability } from '@/routes/calendar/calendarUtils.js';
import { getAppointmentsForCalendar } from '@/services/appointment/appointmentService.js';
import { AppointmentDataType } from '@/@types/appointmentsTypes.js';

const router = express.Router();

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

const calendarRouteNewLogic = async (dbPool: any, paramDate: Date_ISO_Type, serviceId: number, employeeIds: number[]): Promise<PeriodWithGroupedTimeslotsType[]> => {
  const service = await getService(dbPool, serviceId);
  const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);
  const groupedEmployeeAvailability = await getGroupEmployeeAvailability(dbPool, employeeIds);

  console.log(`groupedEmployeeAvailability: `, JSON.stringify(groupedEmployeeAvailability, null, 4));

  const periodWithDaysAndEmployeeAvailability = getPeriodWithDaysAndEmployeeAvailability(paramDate, groupedEmployeeAvailability);
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
  console.log(`\x1b[31m========================\x1b[0m`);

  // Загружаем события Google Calendar только для конкретных сотрудников и дней
  const googleCalendarEvents: { start: string; end: string; summary: string }[] = [];

  if (periodWithDaysAndEmployeeAvailability.length > 0) {
    console.log(`Loading Google Calendar events for specific employees and days`);

    // Создаем карту сотрудник -> даты для оптимизации запросов
    const employeeDatesMap = new Map<number, string[]>();

    // Заполняем карту: для каждого сотрудника собираем даты, когда он работает
    periodWithDaysAndEmployeeAvailability.forEach(dayData => {
      dayData.employees.forEach(employee => {
        if (!employeeDatesMap.has(employee.employeeId)) {
          employeeDatesMap.set(employee.employeeId, []);
        }
        employeeDatesMap.get(employee.employeeId)!.push(dayData.day);
      });
    });

    console.log(`Employee dates map:`, Object.fromEntries(employeeDatesMap));

    // Загружаем события для каждого сотрудника только для его рабочих дней
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
        // Продолжаем работу даже если не удалось загрузить события для одного сотрудника
      }
    }
  }

  // Нормализуем данные встреч
  const normalizedSavedAppointments = normalizeSavedAppointments(savedAppointments);

  // Нормализуем данные Google Calendar событий
  const normalizedGoogleEvents: any[] = [];
  if (periodWithDaysAndEmployeeAvailability.length > 0) {
    // Создаем карту сотрудник -> даты для нормализации
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

  // теперь надо проверить normalizedSavedAppointments и normalizedGoogleEvents имееют одинаковые даты и время или перескаемые времана на одном сотруднике


  // Объединяем нормализованные данные
  const allNormalizedAppointments = [...normalizedSavedAppointments, ...normalizedGoogleEvents];

  console.log(`Total normalized appointments (saved + Google Calendar): ${allNormalizedAppointments.length}`);
  console.log(`Normalized saved appointments: ${normalizedSavedAppointments.length}`);
  console.log(`Normalized Google Calendar events: ${normalizedGoogleEvents.length}`);

  const periodWithClearedDays = combinePeriodWithNormalizedAppointments(
    periodWithDaysAndEmployeeAvailability,
    allNormalizedAppointments,
    serviceDurationWithBuffer
  );
  console.log(`\x1b[31m========================\x1b[0m`);
  console.log(`periodWithClearedDays: `, JSON.stringify(periodWithClearedDays, null, 4));
  console.log(`\x1b[31m========================\x1b[0m`);

  const timeSlotsData = generateTimeSlotsFromAvailableTimes(periodWithClearedDays);
  console.log(`\x1b[32m========================\x1b[0m`);
  console.log(`timeSlotsData: `, JSON.stringify(timeSlotsData, null, 4));
  console.log(`\x1b[32m========================\x1b[0m`);

  const groupedTimeSlots = generateGroupedTimeSlots(timeSlotsData);
  console.log(`\x1b[33m========================\x1b[0m`);
  console.log(`groupedTimeSlots: `, JSON.stringify(groupedTimeSlots, null, 4));
  console.log(`\x1b[33m========================\x1b[0m`);

  return groupedTimeSlots;
}

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const parsedUrlQuery = url.parse(req.url, true)?.query;

    // getting request query params
    const paramDate = parsedUrlQuery.date as Date_ISO_Type;
    const serviceId = Number(parsedUrlQuery.serviceId);
    const employeeIds = (parsedUrlQuery.employeeIds as string).split(`,`).map(Number);

    if (typeof paramDate !== `string` || !serviceId || employeeIds.length === 0) {
      res.status(400).json({
        error: `Invalid parameters: date must be a string, serviceId must be provided, and employeeIds cannot be empty`
      });
      return;
    }

    // just call this fucntion to check the logs during development
    // calendarRouteNewLogic(req.dbPool, paramDate, serviceId, employeeIds);
    const groupedTimeSlots = await calendarRouteNewLogic(req.dbPool, paramDate, serviceId, employeeIds);

    res.json(groupedTimeSlots);
    return;

    // get Service from the database
    const service = await getService(req.dbPool, serviceId);
    const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);
    const employeeAvailability = await getEmployeeAvailability(req.dbPool, employeeIds);
    const today = dayjs().startOf(`day`);

    const {
      datesInDesiredPeriod,
      firstDayInPeriod,
      lastDayInPeriod,
    } = getDatesPeriod(paramDate, today, employeeAvailability);

    if (datesInDesiredPeriod.length === 0) {
      res.json([]);
      return;
    }

    // Get all appointments for the given dates and employee IDs using service
    // const savedAppointments = await getAppointmentsForCalendar(
    //   req.dbPool,
    //   datesInDesiredPeriod,
    //   employeeIds,
    //   AppointmentStatusEnum.Active
    // );

    const groupedAppointments: Record<string, AppointmentDataType[]> = {};

    // savedAppointments.forEach((appointment) => {
    //   const dateFormatted = dayjs(appointment.date).format(DATE_FORMAT);
    //   const key = `${dateFormatted}_${appointment.employee.id}`;
    //   if (!groupedAppointments[key]) groupedAppointments[key] = [];
    //   groupedAppointments[key].push(appointment);
    // });

    const googleCalendarEvents: Record<number, {start: Date; end: Date; summary: string}[]> = {};

    // for (const employeeId of employeeIds) {
    //   const startDateString = firstDayInPeriod.format(DATE_FORMAT);
    //   const endDateString = lastDayInPeriod.add(1, 'day').format(DATE_FORMAT);

    //   const employeeEvents = await getGoogleCalendarEvents(
    //     req.dbPool,
    //     employeeId,
    //     startDateString,
    //     endDateString
    //   );

    //   if (employeeEvents) {
    //     googleCalendarEvents[employeeId] = employeeEvents;
    //   }
    // }

    // THIS IS THE RESULT THAT WILL BE RETURNED TO THE CLIENT
    const availableDays: any = [];

    for (const availability of employeeAvailability) {
      let indexDay = firstDayInPeriod;

      // iterate over all days in the period
      while (indexDay.isBefore(lastDayInPeriod) || indexDay.isSame(lastDayInPeriod, `day`)) {

        // starting from tomorrow and if this days included in the employee availability
        if (indexDay.isAfter(today) && indexDay.day() === availability.dayId) {


          const dateFormatted = indexDay.format(DATE_FORMAT);
          const key = `${dateFormatted}_${availability.employeeId}`;

          const blockedTimes = (groupedAppointments[key] || []).map((appointment) => ({
            startBlockedTime: dayjs(appointment.timeStart).format(TIME_FORMAT),
            endBlockedTime: dayjs(appointment.timeEnd).format(TIME_FORMAT),
          }));

          const employeeGoogleEvents = googleCalendarEvents[availability.employeeId] || [];

          employeeGoogleEvents.forEach(event => {
            const eventDate = dayjs(event.start).tz('Europe/Berlin').format(DATE_FORMAT);

            console.log(`Google Calendar event in calendar route:`, {
              eventSummary: event.summary,
              eventStartRaw: event.start,
              eventEndRaw: event.end,
              eventDate: eventDate,
              currentDate: dateFormatted,
              serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              appTimezone: 'Europe/Berlin'
            });

            if (eventDate === dateFormatted) {
              const startBlockedTime = dayjs(event.start).tz('Europe/Berlin').format(TIME_FORMAT);
              const endBlockedTime = dayjs(event.end).tz('Europe/Berlin').format(TIME_FORMAT);

              console.log(`Adding Google event to blockedTimes: ${event.summary}, ${startBlockedTime}-${endBlockedTime}`);

              blockedTimes.push({
                startBlockedTime,
                endBlockedTime
              });
            }
          });

          let availableTimeslots = addTimeSlotsAccordingEmployeeAvailability({
            startTime: availability.startTime,
            endTime: availability.endTime,
            blockedTimes,
            employeeId: availability.employeeId,
          });

          availableTimeslots = disableTimeSlotsForServiceDuration(availableTimeslots, serviceDurationWithBuffer);

          let currentDayIndex = availableDays.findIndex((availableDay: { day: string; }) => availableDay.day === dateFormatted);

          if (currentDayIndex >= 0) {
            availableDays[currentDayIndex] = replaceExistingDayWithNewEmployeeData({
              existingDay: availableDays[currentDayIndex],
              newDay: {
                day: dateFormatted,
                startTime: availability.startTime,
                endTime: availability.endTime,
                availableTimeslots,
              },
            })
          } else {
            availableDays.push(
              {
                day: dateFormatted,
                startTime: availability.startTime,
                endTime: availability.endTime,
                availableTimeslots,
              }
            );
          }
        }

        indexDay = indexDay.add(1, `day`);
      }
    }

    res.json(availableDays);

    return;
  } catch (error) {
    console.error(`Error:`, error);
    res.status(500).json({ error: `Internal Server Error` });

    return;
  }
});

export default router;