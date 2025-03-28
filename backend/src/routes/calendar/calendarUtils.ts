import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import duration from 'dayjs/plugin/duration.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const TIME_FORMAT = 'HH:mm:ss';

interface TimeSlot {
  startTime: string;
  endTime: string;
  disabled: boolean;
  employeeId: number[];
}

interface BlockedTime {
  startBlockedTime: string;
  endBlockedTime: string;
}

interface DayData {
  day: string;
  startTime: string;
  endTime: string;
  availableTimeslots: TimeSlot[];
}

function getAppointmentEndTimeHours(startTime: string, serviceDuration: string): string {
  const parsedStartTime = dayjs(startTime, TIME_FORMAT);
  const parsedServiceDuration = dayjs(serviceDuration, TIME_FORMAT);

  const endTime = parsedStartTime
    .add(parsedServiceDuration.hour(), 'hour')
    .add(parsedServiceDuration.minute(), 'minute')
    .add(parsedServiceDuration.second(), 'second');

  return endTime.format(TIME_FORMAT);
}

function getAppointmentEndTime(startTime: string, serviceDuration: string): string {
  const parsedStartTime = dayjs(startTime);

  const parsedServiceDuration = dayjs(serviceDuration, TIME_FORMAT);
  const endTime = parsedStartTime
    .add(parsedServiceDuration.hour(), 'hour')
    .add(parsedServiceDuration.minute(), 'minute')
    .add(parsedServiceDuration.second(), 'second');

  return endTime.format('YYYY-MM-DD HH:mm:ss');
}

function disableTimeSlotsForServiceDuration(
  availableTimeSlots: TimeSlot[],
  serviceDuration: string
): TimeSlot[] {
  const modifiedTimeSlots = availableTimeSlots.map((slot, slotIndex) => {
    if (slot.disabled) {
      return slot;
    }

    const appointmentEndTime = getAppointmentEndTimeHours(slot.startTime, serviceDuration);

    for (let i = slotIndex; i <= availableTimeSlots.length - 1; i++) {
      const timeSlot = availableTimeSlots[i];

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
}

interface AddTimeSlotsParams {
  startTime: string;
  endTime: string;
  blockedTimes: BlockedTime[];
  employeeId: number;
}

function addTimeSlotsAccordingEmployeeAvailability({
  startTime,
  endTime,
  blockedTimes,
  employeeId,
}: AddTimeSlotsParams): TimeSlot[] {
  const parsedStartTime = dayjs(startTime, TIME_FORMAT);
  const parsedEndTime = dayjs(endTime, TIME_FORMAT);

  const slots: TimeSlot[] = [];
  let currentTime = parsedStartTime;

  while (currentTime.isBefore(parsedEndTime)) {
    const nextTime = currentTime.add(30, 'minute');
    let disabled = false;

    for (const block of blockedTimes) {
      const blockStart = dayjs(block.startBlockedTime, TIME_FORMAT);
      const blockEnd = dayjs(block.endBlockedTime, TIME_FORMAT);

      if (
        (currentTime.isBefore(blockEnd) && nextTime.isAfter(blockStart)) ||
        (currentTime.isSame(blockStart) && nextTime.isSame(blockEnd))
      ) {
        disabled = true;
        break;
      }
    }

    const employeeIds = disabled ? [] : [employeeId];

    slots.push({
      startTime: currentTime.format(TIME_FORMAT),
      endTime: nextTime.format(TIME_FORMAT),
      disabled,
      employeeId: employeeIds,
    });
    currentTime = nextTime;
  }

  return slots;
}

interface ReplaceDayParams {
  existingDay: DayData;
  newDay: DayData;
}

function replaceExistingDayWithNewEmployeeData({ existingDay, newDay }: ReplaceDayParams): DayData {
  const mergedTimeslots: Record<string, TimeSlot> = {};

  // Объединяем слоты из существующего и нового дня
  [...existingDay.availableTimeslots, ...newDay.availableTimeslots].forEach(timeslot => {
    const key = `${timeslot.startTime}-${timeslot.endTime}`;
    if (!mergedTimeslots[key]) {
      mergedTimeslots[key] = { ...timeslot };
    } else {
      // Добавляем employeeId из нового таймслота, если их там еще нет
      mergedTimeslots[key].employeeId.push(
        ...timeslot.employeeId.filter(id => !mergedTimeslots[key].employeeId.includes(id))
      );
      // Если оба слота были disabled, оставляем disabled, иначе false
      if (timeslot.disabled && mergedTimeslots[key].disabled) {
        mergedTimeslots[key].disabled = true;
      } else {
        mergedTimeslots[key].disabled = false;
      }
    }
  });

  const availableTimeslots = Object.values(mergedTimeslots);

  // Сортируем по startTime
  availableTimeslots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    day: existingDay.day,
    startTime: existingDay.startTime,
    endTime: existingDay.endTime,
    availableTimeslots
  };
}

export {
  getAppointmentEndTime,
  disableTimeSlotsForServiceDuration,
  addTimeSlotsAccordingEmployeeAvailability,
  replaceExistingDayWithNewEmployeeData,
};
