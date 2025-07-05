import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

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

function getDatesPeriod(date: Date_ISO_Type, today: dayjs.Dayjs): {
  datesInDesiredPeriod: Date_ISO_Type[];
  firstDayInPeriod: dayjs.Dayjs;
  lastDayInPeriod: dayjs.Dayjs;
} {
  const dateObj = dayjs(date, { format: DATE_FORMAT });

  const firstDayOfSearch = dateObj.startOf(`week`);
  const lastDayOfSearch = dateObj.endOf(`week`);

  const datesInRange: Date_ISO_Type[] = [];
  let tempDay = firstDayOfSearch;

  /**
   * generate array of dates in week
   * eg. if date is 2025-07-05, then datesInRange will be
   * [2025-07-01, 2025-07-02, 2025-07-03, 2025-07-04, 2025-07-05]
   */
  while (tempDay.isBefore(lastDayOfSearch) || tempDay.isSame(lastDayOfSearch, `day`)) {
    if (tempDay.isAfter(today)) {
      datesInRange.push(tempDay.format(DATE_FORMAT) as Date_ISO_Type);
    }
    tempDay = tempDay.add(1, `day`);
  }

  return {
    datesInDesiredPeriod: datesInRange,
    firstDayInPeriod: firstDayOfSearch,
    lastDayInPeriod: lastDayOfSearch,
  };
}

function getAppointmentEndTimeHours(startTime: string, serviceDuration: string): string {
  const parsedStartTime = dayjs.tz(startTime, TIME_FORMAT, 'Europe/Berlin');
  const parsedServiceDuration = dayjs.tz(serviceDuration, TIME_FORMAT, 'Europe/Berlin');

  const endTime = parsedStartTime
    .add(parsedServiceDuration.hour(), `hour`)
    .add(parsedServiceDuration.minute(), `minute`)
    .add(parsedServiceDuration.second(), `second`);

  return endTime.format(TIME_FORMAT);
}

function getAppointmentEndTime(startTime: dayjs.Dayjs, serviceDuration: Time_HH_MM_SS_Type): dayjs.Dayjs {
  const parsedServiceDuration = dayjs(serviceDuration, TIME_FORMAT);

  return startTime
    .add(parsedServiceDuration.hour(), `hour`)
    .add(parsedServiceDuration.minute(), `minute`)
    .add(parsedServiceDuration.second(), `second`);
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

  [...existingDay.availableTimeslots, ...newDay.availableTimeslots].forEach(timeslot => {
    const key = `${timeslot.startTime}-${timeslot.endTime}`;
    if (!mergedTimeslots[key]) {
      mergedTimeslots[key] = { ...timeslot };
    } else {
      mergedTimeslots[key].employeeId.push(
        ...timeslot.employeeId.filter(id => !mergedTimeslots[key].employeeId.includes(id))
      );
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
  getDatesPeriod,
  getAppointmentEndTime,
  disableTimeSlotsForServiceDuration,
  addTimeSlotsAccordingEmployeeAvailability,
  replaceExistingDayWithNewEmployeeData,
};
