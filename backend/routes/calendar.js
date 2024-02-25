const express = require("express");
const router = express.Router();
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const duration = require('dayjs/plugin/duration');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const isBetween = require('dayjs/plugin/isBetween')
require('dayjs/locale/de')
const { getServiceDuration } = require('../utils/timeUtils');

dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(customParseFormat);
dayjs.extend(isBetween)
dayjs.locale('de')

const TIME_FORMAT = 'HH:mm:ss';
const DATE_FORMAT = 'YYYY-MM-DD';

const getAppointmentEndTime = (startTime, serviceDuration) => {
  const parsedStartTime = dayjs(startTime, TIME_FORMAT);
  const parsedServiceDuration = dayjs(serviceDuration, TIME_FORMAT);

  // Add the times together
  const endTime = parsedStartTime.add(parsedServiceDuration.hour(), 'hour').add(parsedServiceDuration.minute(), 'minute').add(parsedServiceDuration.second(), 'second');

  return endTime.format(TIME_FORMAT);
}

const filterTimeSlots = (availableTimeSlots, serviceDuration) => {
  const modifiedTimeSlots = availableTimeSlots.map((slot, slotIndex) => {
    if (slot.disabled) {
      return slot;
    }

    const appointmentEndTime = getAppointmentEndTime(slot.startTime, serviceDuration);

    for (let i = slotIndex; i <= availableTimeSlots.length - 1; i++) {
      let timeSlot = availableTimeSlots[i];

      if (timeSlot.disabled) {
        return {
          ...slot,
          disabled: true,
          notActive: true,
        };
      }

      if (dayjs(timeSlot.endTime, TIME_FORMAT).isBefore(dayjs(appointmentEndTime, TIME_FORMAT))) {
        if (i + 1 === availableTimeSlots.length) {
          return {
            ...slot,
            disabled: true,
            notActive: true,
          };
        }
      } else if (dayjs(timeSlot.endTime, TIME_FORMAT).isSame(dayjs(appointmentEndTime, TIME_FORMAT))) {
        break;
      } else {
        break;
      }
    }

    return slot;
  });
  
  return modifiedTimeSlots;
};

module.exports = (db) => {
  router.get("/:date/:serviceId", async (req, res) => {
    try {
      const paramDate = req.params.date;
      const serviceId = req.params.serviceId;

      // get Service from the database
      const serviceQuery = 'SELECT * FROM Services WHERE id = ?';
      const [serviceRows] = await db.promise().query(serviceQuery, [serviceId]);

      //get service duration (service_time + buffer_time)
      const serviceDurationWithBuffer = getServiceDuration(serviceRows[0].duration_time, serviceRows[0].buffer_time);

      // get EmployeeAvailability from the database
      const employeeAvailabilityQuery = `SELECT DISTINCT employee_id, day_id, start_time, end_time FROM EmployeeAvailability`;
      const [employeeAvailabilityRows] = await db.promise().query(employeeAvailabilityQuery);
      const employeeAvailability = employeeAvailabilityRows.map(row => ({
        employeeId: row.employee_id,
        dayId: row.day_id,
        startTime: row.start_time,
        endTime: row.end_time,
      }));
    
      const addTimeSlotsAccordingEmployeeAvailability = async (startTime, endTime, date) => {
        const blockedTimes = await findBlockedTimeSlots(date);

        const parsedStartTime = dayjs(startTime, TIME_FORMAT);
        const parsedEndTime = dayjs(endTime, TIME_FORMAT);
    
        const slots = [];
        let currentTime = parsedStartTime;
    
        while (currentTime.isBefore(parsedEndTime)) {
          const nextTime = currentTime.add(30, 'minute');
          let disabled = false;
  
          // Check if current slot overlaps with any blocked period
          for (const block of blockedTimes) {
            const blockStart = dayjs(block.startBlockedTime, TIME_FORMAT);
            const blockEnd = dayjs(block.endBlockedTime, TIME_FORMAT);
            if (
                (currentTime.isBefore(blockEnd) && nextTime.isAfter(blockStart)) || // Slot overlaps with blocked period
                (currentTime.isSame(blockStart) && nextTime.isSame(blockEnd)) // Slot is completely within blocked period
            ) {
              disabled = true;
              break;
            }
          }
  
          slots.push({
              startTime: currentTime.format(TIME_FORMAT),
              endTime: nextTime.format(TIME_FORMAT),
              disabled: disabled
          });
          currentTime = nextTime;
        }

        const filteredSlots = filterTimeSlots(slots, serviceDurationWithBuffer);

        return filteredSlots;
      }

      const findBlockedTimeSlots = async (date) => {
        // Query MySQL to get all entries for the target date
        const savedAppointmentsQuery = `SELECT * FROM SavedAppointments WHERE date = ?`;
        const [results] = await db.promise().query(savedAppointmentsQuery, [date]);

        const blockedTimes = results.map(appointment => ({
          startBlockedTime: dayjs(appointment.time, TIME_FORMAT),
          endBlockedTime: dayjs(getAppointmentEndTime(appointment.time, appointment.service_duration), TIME_FORMAT),
        }));

        return blockedTimes;
        // let updatedTimeslots = [...availableTimeslots];
        // console.log(updatedTimeslots);

        // // Define the date for which you want to check appointments
        // const targetDate = date;

        // // Query MySQL to get all entries for the target date
        // const savedAppointmentsQuery = `SELECT * FROM SavedAppointments WHERE date = ?`;
        // const [results] = await db.promise().query(savedAppointmentsQuery, [targetDate]);

        // // Iterate over the results and identify occupied timeslots
        // results.forEach(appointment => {
        //   const rangeStartTime = dayjs(appointment.time, TIME_FORMAT);
        //   const rangeEndTime = dayjs(getAppointmentEndTime(appointment.time, appointment.service_duration), TIME_FORMAT);

        //   updatedTimeslots = updatedTimeslots.filter((timeslot) => {
        //     const slotStartTime = dayjs(timeslot.startTime, TIME_FORMAT);
        //     const slotEndTime = dayjs(timeslot.endTime, TIME_FORMAT);

        //     // Check if timeslot falls outside the specified range
        //     return slotStartTime.isSameOrAfter(rangeEndTime) || slotEndTime.isSameOrBefore(rangeStartTime);
        //   });
        // });

        // return updatedTimeslots;
      };
      
      // Iterate through all employeeAvailability from the database
      const dateObj = dayjs(paramDate, { format: DATE_FORMAT });
      const today = dayjs().startOf('day');
      const firstDayOfMonth = dateObj.startOf('month');
      const lastDayOfMonth = dateObj.endOf('month');
      const availableDays = [];

      for (const availability of employeeAvailability) {
        let currentDay = firstDayOfMonth;

        // Iterate through the days of the month for each row
        while (currentDay.isBefore(lastDayOfMonth) || currentDay.isSame(lastDayOfMonth, 'day')) {
          // Check if the day is in the future (excluding today)
          if (currentDay.isAfter(today) && currentDay.day() === availability.dayId) {
            let availableTimeslots = await addTimeSlotsAccordingEmployeeAvailability(availability.startTime, availability.endTime, currentDay.format(DATE_FORMAT));

            availableDays.push(
              { 
                day: currentDay.format(DATE_FORMAT),
                employeeId: availability.employeeId,
                startTime: availability.startTime,
                endTime: availability.endTime,
                availableTimeslots,
              }
            );
          }
          currentDay = currentDay.add(1, 'day');
        }
      }

      res.json(availableDays);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
