const { getServiceDuration } = require('../../utils/timeUtils');
const express = require('express');
const router = express.Router();
const url = require('url');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const { 
  addTimeSlotsAccordingEmployeeAvailability,
  disableTimeSlotsForServiceDuration,
  getAppointmentEndTime,
  replaceExistingDayWithNewEmployeeData,
} = require('./calendarUtils');

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.locale(`de`);

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

const findBlockedTimeSlots = async ({db, date, employeeId}) => {
  // Query MySQL to get all entries for the target date
  const savedAppointmentsQuery = `SELECT * FROM SavedAppointments WHERE date = ? AND employee_id = ?`;
  const [results] = await db.promise().query(savedAppointmentsQuery, [date, employeeId]);

  const blockedTimes = results.map(appointment => {
    return {
      startBlockedTime: dayjs(appointment.time, TIME_FORMAT),
      endBlockedTime: dayjs(getAppointmentEndTime(appointment.time, appointment.service_duration), TIME_FORMAT),
  }});

  return blockedTimes;
};

module.exports = (db) => {
  router.get(`/`, async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
    
      // getting request query params
      const paramDate = parsedUrl.query.date;
      const serviceId = parsedUrl.query.serviceId;
      const employeeIds = parsedUrl.query.employeeIds;

      // get Service from the database
      const serviceQuery = `SELECT * FROM Services WHERE id = ?`;
      const [serviceRows] = await db.promise().query(serviceQuery, [serviceId]);

      //get service duration (service_time + buffer_time)
      const serviceDurationWithBuffer = getServiceDuration(serviceRows[0].duration_time, serviceRows[0].buffer_time);

      // Construct the SQL query with the WHERE clause to filter by specific employee IDs
      const employeeAvailabilityQuery = `
        SELECT DISTINCT employee_id, day_id, start_time, end_time
        FROM EmployeeAvailability
        WHERE employee_id IN (${employeeIds})
      `;
      const [employeeAvailabilityRows] = await db.promise().query(employeeAvailabilityQuery);
      const employeeAvailability = employeeAvailabilityRows.map(row => ({
        employeeId: row.employee_id,
        dayId: row.day_id,
        startTime: row.start_time,
        endTime: row.end_time,
      }));
      
      // Iterate through all employeeAvailability from the database
      const dateObj = dayjs(paramDate, { format: DATE_FORMAT });
      const today = dayjs().startOf(`day`);
      const firstDayOfMonth = dateObj.startOf(`month`);
      const lastDayOfMonth = dateObj.endOf(`month`);
      const availableDays = [];

      for (const availability of employeeAvailability) {
        let currentDay = firstDayOfMonth;

        // Iterate through the days of the month for each row
        while (currentDay.isBefore(lastDayOfMonth) || currentDay.isSame(lastDayOfMonth, `day`)) {
          // Check if the day is in the future (excluding today)
          if (currentDay.isAfter(today) && currentDay.day() === availability.dayId) {
            let blockedTimes = await findBlockedTimeSlots({
              db,
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

            let currentDayIndex = availableDays.findIndex(availableDay => availableDay.day === currentDay.format(DATE_FORMAT));

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
    } catch (error) {
      console.error(`Error:`, error);
      res.status(500).json({ error: `Internal Server Error` });
    }
  });

  return router;
};
