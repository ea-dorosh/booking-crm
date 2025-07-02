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
import { RowDataPacket } from 'mysql2';
import { getGoogleCalendarEvents } from '@/services/googleCalendar/googleCalendarService.js';
import { AppointmentStatusEnum } from '@/enums/enums.js';

const router = express.Router();

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

interface SavedAppointmentRow extends RowDataPacket {
  date: string;
  employee_id: number;
  time_start: string;
  time_end: string;
}

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    const parsedUrl = url.parse(req.url, true);

    // getting request query params
    const paramDate = parsedUrl.query.date;
    if (typeof paramDate !== 'string') {
      res.status(400).json({ error: `Invalid date` });
      return;
    }

    const serviceId = Number(parsedUrl.query.serviceId);
    const employeeIds = (parsedUrl.query.employeeIds as string).split(',').map(Number);

    if (employeeIds.length === 0) {
      res.status(400).json({ error: `Invalid employeeIds` });
      return;
    }

    // get Service from the database
    const service = await getService(req.dbPool, serviceId);
    const serviceDurationWithBuffer = getServiceDuration(service.durationTime, service.bufferTime);

    // Construct the SQL query with the WHERE clause to filter by specific employee IDs
    const employeeAvailabilityQuery = `
      SELECT DISTINCT employee_id, day_id, start_time, end_time
      FROM EmployeeAvailability
      WHERE employee_id IN (${employeeIds})
    `;

    interface EmployeeAvailabilityRowType extends RowDataPacket {
      employee_id: number;
      day_id: number;
      start_time: string;
      end_time: string;
    }

    const [employeeAvailabilityRows] = await req.dbPool.query<EmployeeAvailabilityRowType[]>(employeeAvailabilityQuery);
    const employeeAvailability = employeeAvailabilityRows.map(row => ({
      employeeId: row.employee_id,
      dayId: row.day_id,
      startTime: row.start_time,
      endTime: row.end_time,
    }));

    // Iterate through all employeeAvailability from the database
    const dateObj = dayjs(paramDate, { format: DATE_FORMAT });
    const today = dayjs().startOf(`day`);

    const firstDayOfSearch = dateObj.startOf(`week`);
    const lastDayOfSearch = dateObj.endOf(`week`);
    const availableDays: any = [];

    const datesInRange: string[] = [];
    let tempDay = firstDayOfSearch;

    while (tempDay.isBefore(lastDayOfSearch) || tempDay.isSame(lastDayOfSearch, 'day')) {
      if (tempDay.isAfter(today)) datesInRange.push(tempDay.format(DATE_FORMAT));
      tempDay = tempDay.add(1, 'day');
    }

    if (datesInRange.length === 0) {
      res.json([]);
      return;
    }

    // Get all appointments for the given dates and employee IDs
    const savedAppointmentsQuery = `
      SELECT * FROM SavedAppointments
      WHERE date IN (${datesInRange.map(() => '?').join(',')})
      AND employee_id IN (${employeeIds.map(() => '?').join(',')})
      AND status = ?
    `;

    const [appointmentResults] = await req.dbPool.query<SavedAppointmentRow[]>(savedAppointmentsQuery, [
      ...datesInRange,
      ...employeeIds,
      AppointmentStatusEnum.Active
    ]);

    const groupedAppointments: Record<string, SavedAppointmentRow[]> = {};

    appointmentResults.forEach((appointment) => {
      const dateFormatted = dayjs(appointment.date).format(DATE_FORMAT);
      const key = `${dateFormatted}_${appointment.employee_id}`;
      if (!groupedAppointments[key]) groupedAppointments[key] = [];
      groupedAppointments[key].push(appointment);
    });

    const googleCalendarEvents: Record<number, {start: Date; end: Date; summary: string}[]> = {};

    for (const employeeId of employeeIds) {
      const startDateString = firstDayOfSearch.format(DATE_FORMAT);
      const endDateString = lastDayOfSearch.add(1, 'day').format(DATE_FORMAT);

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
      let currentDay = firstDayOfSearch;

      while (currentDay.isBefore(lastDayOfSearch) || currentDay.isSame(lastDayOfSearch, `day`)) {
        if (currentDay.isAfter(today) && currentDay.day() === availability.dayId) {
          const dateFormatted = currentDay.format(DATE_FORMAT);
          const key = `${dateFormatted}_${availability.employeeId}`;

          const blockedTimes = (groupedAppointments[key] || []).map((appointment) => ({
            startBlockedTime: dayjs(appointment.time_start).format(TIME_FORMAT),
            endBlockedTime: dayjs(appointment.time_end).format(TIME_FORMAT),
          }));

          const employeeGoogleEvents = googleCalendarEvents[availability.employeeId] || [];

          employeeGoogleEvents.forEach(event => {
            const eventDate = dayjs(event.start).format(DATE_FORMAT);

            if (eventDate === dateFormatted) {
              const startBlockedTime = dayjs(event.start).format(TIME_FORMAT);
              const endBlockedTime = dayjs(event.end).format(TIME_FORMAT);

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