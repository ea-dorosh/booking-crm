import express from 'express';
import url from 'url';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import {
  addTimeSlotsAccordingEmployeeAvailability,
  disableTimeSlotsForServiceDuration,
  replaceExistingDayWithNewEmployeeData,
} from '@/routes/calendar/calendarUtils.js';
import { getServiceDuration } from '@/utils/timeUtils.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { getService } from '@/services/service/serviceService.js';
import { getGoogleCalendarEvents } from '@/services/googleCalendar/googleCalendarService.js';
import { AppointmentStatusEnum } from '@/enums/enums.js';
import { getEmployeeAvailability } from '@/services/employees/employeesService.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getDatesPeriod } from '@/routes/calendar/calendarUtils.js';
import { getAppointmentsForCalendar } from '@/services/appointment/appointmentService.js';
import { AppointmentDataType } from '@/@types/appointmentsTypes.js';

const router = express.Router();

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

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
    const today = dayjs().startOf(`day`);

    if (typeof paramDate !== `string` || !serviceId || employeeIds.length === 0) {
      res.status(400).json({
        error: `Invalid parameters: date must be a string, serviceId must be provided, and employeeIds cannot be empty`
      });
      return;
    }

    // get Service from the database
    const service = await getService(req.dbPool, serviceId);
    const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);
    const employeeAvailability = await getEmployeeAvailability(req.dbPool, employeeIds);

    // THIS IS THE RESULT THAT WILL BE RETURNED TO THE CLIENT
    const availableDays: any = [];

    const {
      datesInDesiredPeriod,
      firstDayInPeriod,
      lastDayInPeriod,
    } = getDatesPeriod(paramDate, today);

    if (datesInDesiredPeriod.length === 0) {
      res.json([]);
      return;
    }

    // Get all appointments for the given dates and employee IDs using service
    const savedAppointments = await getAppointmentsForCalendar(
      req.dbPool,
      datesInDesiredPeriod,
      employeeIds,
      AppointmentStatusEnum.Active
    );

    const groupedAppointments: Record<string, AppointmentDataType[]> = {};

    savedAppointments.forEach((appointment) => {
      const dateFormatted = dayjs(appointment.date).format(DATE_FORMAT);
      const key = `${dateFormatted}_${appointment.employee.id}`;
      if (!groupedAppointments[key]) groupedAppointments[key] = [];
      groupedAppointments[key].push(appointment);
    });

    const googleCalendarEvents: Record<number, {start: Date; end: Date; summary: string}[]> = {};

    for (const employeeId of employeeIds) {
      const startDateString = firstDayInPeriod.format(DATE_FORMAT);
      const endDateString = lastDayInPeriod.add(1, 'day').format(DATE_FORMAT);

      const employeeEvents = await getGoogleCalendarEvents(
        req.dbPool,
        employeeId,
        startDateString,
        endDateString
      );

      if (employeeEvents) {
        googleCalendarEvents[employeeId] = employeeEvents;
      }
    }

    for (const availability of employeeAvailability) {
      let currentDay = firstDayInPeriod;

      while (currentDay.isBefore(lastDayInPeriod) || currentDay.isSame(lastDayInPeriod, `day`)) {
        if (currentDay.isAfter(today) && currentDay.day() === availability.dayId) {
          const dateFormatted = currentDay.format(DATE_FORMAT);
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
        currentDay = currentDay.add(1, `day`);
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