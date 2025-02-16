import express from 'express';
import url from 'url';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import {
  addTimeSlotsAccordingEmployeeAvailability,
  disableTimeSlotsForServiceDuration,
  replaceExistingDayWithNewEmployeeData,
} from '@/routes/calendar/calendarUtils.js';
import { getServiceDuration } from '@/utils/timeUtils.js';
import {
  CustomRequestType,
  CustomResponseType,
  DbPoolType,
} from '@/@types/expressTypes.js';
import { getService } from '@/services/service/serviceService.js';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.locale(`de`);

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

const findBlockedTimeSlots = async ({db, date, employeeId}: { db: DbPoolType, date: string, employeeId: number }) => {
  // Query MySQL to get all entries for the target date
  const savedAppointmentsQuery = `SELECT * FROM SavedAppointments WHERE date = ? AND employee_id = ?`;

  interface SavedAppointmentRow extends RowDataPacket {
    time_start: string;
    time_end: string;
  }
  const [appointmentResults] = await db.query<SavedAppointmentRow[]>(savedAppointmentsQuery, [date, employeeId]);

  const blockedTimes = appointmentResults.map(appointment => {
    return {
      startBlockedTime: dayjs(appointment.time_start, TIME_FORMAT).format(TIME_FORMAT),
      endBlockedTime: dayjs(appointment.time_end, TIME_FORMAT).format(TIME_FORMAT),
  }});

  return blockedTimes;
};

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
    const employeeIds = parsedUrl.query.employeeIds;

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

    const firstDayOfMonth = dateObj.startOf(`week`);
    const lastDayOfMonth = dateObj.endOf(`week`);
    const availableDays: any = [];

    for (const availability of employeeAvailability) {
      let currentDay = firstDayOfMonth;

      // Iterate through the days of the month for each row
      while (currentDay.isBefore(lastDayOfMonth) || currentDay.isSame(lastDayOfMonth, `day`)) {
        // Check if the day is in the future (excluding today)
        if (currentDay.isAfter(today) && currentDay.day() === availability.dayId) {
          let blockedTimes = await findBlockedTimeSlots({
            db: req.dbPool,
            date: currentDay.format(DATE_FORMAT),
            employeeId: availability.employeeId,
          });

          let availableTimeslots = addTimeSlotsAccordingEmployeeAvailability({
            startTime: availability.startTime,
            endTime: availability.endTime,
            blockedTimes,
            employeeId: availability.employeeId,
          });

          availableTimeslots = disableTimeSlotsForServiceDuration(availableTimeslots, serviceDurationWithBuffer);

          let currentDayIndex = availableDays.findIndex((availableDay: { day: string; }) => availableDay.day === currentDay.format(DATE_FORMAT));

          if (currentDayIndex >= 0) {
            availableDays[currentDayIndex] = replaceExistingDayWithNewEmployeeData({
              existingDay: availableDays[currentDayIndex],
              newDay: {
                day: currentDay.format(DATE_FORMAT),
                startTime: availability.startTime,
                endTime: availability.endTime,
                availableTimeslots,
              },
            })
          } else {
            availableDays.push(
              {
                day: currentDay.format(DATE_FORMAT),
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