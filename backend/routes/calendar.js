const express = require("express");
const router = express.Router();
const dayjs = require('dayjs');
require('dayjs/locale/de')

dayjs.locale('de')

module.exports = (db) => {
  router.get("/:date", async (req, res) => {
    try {
      const paramDate = req.params.date;

      // get Timeslots from the database
      const sqlTimeSlots = 'SELECT timeslot_id, start_time, end_time FROM TimeSlots';
      const [timeSlotsRows] = await db.promise().query(sqlTimeSlots);
      const timeSlots = timeSlotsRows.map((row) => ({
        timeslotId: row.timeslot_id,
        startTime: row.start_time,
        endTime: row.end_time,
      }));

      const dateObj = dayjs(paramDate, { format: "YYYY-MM-DD" });

      // get EmployeeAvailability from the database
      const query = `SELECT DISTINCT employee_id, day_id, start_time_id, end_time_id FROM EmployeeAvailability`;
      const [employeeAvailability] = await db.promise().query(query);

      const addTimeSlots = (startTimeId, endTimeId) => {
        return timeSlots.filter((timeslot) => {
          return timeslot.timeslotId >= startTimeId && timeslot.timeslotId <= endTimeId;
        });
      }

      // Iterate through all employeeAvailability from the database
      const today = dayjs().startOf('day');
      const firstDayOfMonth = dateObj.startOf('month');
      const lastDayOfMonth = dateObj.endOf('month');
      const availableDays = [];

      for (const availability of employeeAvailability) {
        let currentDay = firstDayOfMonth;

        // Iterate through the days of the month for each row
        while (currentDay.isBefore(lastDayOfMonth) || currentDay.isSame(lastDayOfMonth, 'day')) {
          // Check if the day is in the future (excluding today)
          if (currentDay.isAfter(today) && currentDay.day() === availability.day_id) {
            availableDays.push(
              { 
                day: currentDay.format('YYYY-MM-DD'),
                employeeId: availability.employee_id,
                startTimeId: availability.start_time_id,
                endTimeId: availability.end_time_id,
                availableTimeslots: addTimeSlots(availability.start_time_id, availability.end_time_id)
              }
            );
          }
          currentDay = currentDay.add(1, 'day');
        }
      }

      res.json(availableDays);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
