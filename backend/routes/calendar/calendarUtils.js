const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const duration = require('dayjs/plugin/duration');
const isBetween = require('dayjs/plugin/isBetween');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const TIME_FORMAT = 'HH:mm:ss';

const getAppointmentEndTime = (startTime, serviceDuration) => {

  const parsedStartTime = dayjs(startTime, TIME_FORMAT);
  const parsedServiceDuration = dayjs(serviceDuration, TIME_FORMAT);

  const endTime = parsedStartTime
    .add(parsedServiceDuration.hour(), 'hour')
    .add(parsedServiceDuration.minute(), 'minute')
    .add(parsedServiceDuration.second(), 'second');

  return endTime.format(TIME_FORMAT);
};

const disableTimeSlotsForServiceDuration = (availableTimeSlots, serviceDuration) => {
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
          employeeId: [],
        };
      }

      if (dayjs(timeSlot.endTime, TIME_FORMAT).isBefore(dayjs(appointmentEndTime, TIME_FORMAT))) {
        if (i + 1 === availableTimeSlots.length) {
          return {
            ...slot,
            disabled: true,
            employeeId: [],
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

const addTimeSlotsAccordingEmployeeAvailability = ({
  startTime, endTime, blockedTimes, employeeId,
}) => {
  const parsedStartTime = dayjs(startTime, TIME_FORMAT);
  const parsedEndTime = dayjs(endTime, TIME_FORMAT);

  const slots = [];
  let currentTime = parsedStartTime;

  while (currentTime.isBefore(parsedEndTime)) {
    const nextTime = currentTime.add(30, `minute`);
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

    let employeeIds = [];

    if (!disabled) {
      employeeIds = [employeeId];
    }

    slots.push({
        startTime: currentTime.format(TIME_FORMAT),
        endTime: nextTime.format(TIME_FORMAT),
        disabled: disabled,
        employeeId: employeeIds,
    });
    currentTime = nextTime;
  }

  return slots;
}

const replaceExistingDayWithNewEmployeeData = ({existingDay, newDay}) => {
  const mergedTimeslots = {};

  // Combine timeslots from both existing and new day
  [...existingDay.availableTimeslots, ...newDay.availableTimeslots].forEach(timeslot => {
    const key = `${timeslot.startTime}-${timeslot.endTime}`;
    if (!mergedTimeslots[key]) {
      mergedTimeslots[key] = { ...timeslot };
    } else {
      mergedTimeslots[key].employeeId.push(...timeslot.employeeId.filter(id => !mergedTimeslots[key].employeeId.includes(id)));
      // Set disabled to true only if both existing and new timeslots are disabled
      if (timeslot.disabled && mergedTimeslots[key].disabled) {
        mergedTimeslots[key].disabled = true;
      } else {
        mergedTimeslots[key].disabled = false;
      }
    }
  });

  // Convert merged timeslots back to array
  const availableTimeslots = Object.values(mergedTimeslots);

  // Sort timeslots by start time
  availableTimeslots.sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  // Replace existing day with merged timeslots
  return {
    day: existingDay.day,
    startTime: existingDay.startTime,
    endTime: existingDay.endTime,
    availableTimeslots
  };
};

module.exports = {
  getAppointmentEndTime,
  disableTimeSlotsForServiceDuration,
  addTimeSlotsAccordingEmployeeAvailability,
  replaceExistingDayWithNewEmployeeData,
};
