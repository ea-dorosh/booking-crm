import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { EmployeeAvailabilityDataType, GroupedAvailabilityDayType } from '@/@types/employeesTypes.js';
import { AppointmentDataType } from '@/@types/appointmentsTypes.js';

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

interface TimeSlot {
  startTime: string;
  endTime: string;
  disabled: boolean;
  employeeId: number[];
}

interface BlockedTime {
  startBlockedTime: dayjs.Dayjs;
  endBlockedTime: dayjs.Dayjs;
}

interface AvailableTime {
  minPossibleStartTime: dayjs.Dayjs;
  maxPossibleStartTime: dayjs.Dayjs;
}

interface DayData {
  day: string;
  startTime: string;
  endTime: string;
  availableTimeslots: TimeSlot[];
}

export interface GetDatesPeriodResultType {
  datesInDesiredPeriod: Date_ISO_Type[];
  firstDayInPeriod: dayjs.Dayjs;
  lastDayInPeriod: dayjs.Dayjs;
}

export interface PeriodWithEmployeeWorkingTimeType {
  day: Date_ISO_Type;
  employees: EmployeeWithWorkingTimesType[];
}

interface PeriodWithClearedDaysType {
  day: Date_ISO_Type;
  employees: EmployeeWithBlockedAndAvailableTimesType[];
}

interface EmployeeWithWorkingTimesType {
  employeeId: number;
  startWorkingTime: dayjs.Dayjs;
  endWorkingTime: dayjs.Dayjs;
}

interface EmployeeWithBlockedAndAvailableTimesType {
  employeeId: number;
  startWorkingTime: dayjs.Dayjs;
  endWorkingTime: dayjs.Dayjs;
  blockedTimes: BlockedTime[];
  availableTimes: AvailableTime[];
}

export interface PeriodWithDaysAndEmployeeAvailabilityTypeWithBlockedTimes {
  day: Date_ISO_Type;
  employees: {
    employeeId: number;
    startWorkingTime: Time_HH_MM_SS_Type;
    endWorkingTime: Time_HH_MM_SS_Type;
    blockedTimes: BlockedTime[];
    availableTimes: AvailableTime[];
  }[];
}

interface AvailableTimeSlot {
  startTime: dayjs.Dayjs;
  endTime: dayjs.Dayjs;
}

interface EmployeeWithTimeSlots {
  employeeId: number;
  availableTimeSlots: AvailableTimeSlot[];
}
interface DayWithTimeSlots {
  day: Date_ISO_Type;
  employees: EmployeeWithTimeSlots[];
}

export interface PeriodWithGroupedTimeslotsType {
  day: Date_ISO_Type;
  availableTimeslots: TimeslotWithGroupedEmployeeId[];
}

interface TimeslotWithGroupedEmployeeId {
  employeeId: number[];
  startTime: Time_HH_MM_SS_Type; // in german time zone
}

// HELPER FUNCTIONS
/**
 * Calculate adjusted end time by subtracting service duration from a given time
 * @param baseTime - time in HH:mm:ss format
 * @param serviceDuration - service duration in HH:mm:ss format
 * @returns adjusted time in HH:mm:ss format
 */
const calculateAdjustedEndTime = (baseTime: dayjs.Dayjs, serviceDuration: Time_HH_MM_SS_Type): dayjs.Dayjs => {
  const result = dayjs(baseTime, TIME_FORMAT)
    .subtract(dayjs(serviceDuration, TIME_FORMAT).hour(), 'hour')
    .subtract(dayjs(serviceDuration, TIME_FORMAT).minute(), 'minute')
    .subtract(dayjs(serviceDuration, TIME_FORMAT).second(), 'second')
    .utc();

  return result;
}

function calculateAvailableTimes(
  startWorkingTime: dayjs.Dayjs,
  endWorkingTime: dayjs.Dayjs,
  blockedTimes: BlockedTime[],
  serviceDuration: Time_HH_MM_SS_Type
): AvailableTime[] {
  const availableTimes: AvailableTime[] = [];

  if (blockedTimes.length === 0) {
    const adjustedEndTime = calculateAdjustedEndTime(endWorkingTime, serviceDuration);

    if (dayjs(adjustedEndTime, TIME_FORMAT).isAfter(dayjs(startWorkingTime, TIME_FORMAT))) {
      return [{
        minPossibleStartTime: startWorkingTime,
        maxPossibleStartTime: adjustedEndTime
      }];
    }
    return [];
  }

  const sortedBlockedTimes = [...blockedTimes].sort((a, b) => a.startBlockedTime.isBefore(b.startBlockedTime) ? -1 : 1);

  let currentTime = startWorkingTime;

  for (const blockedTime of sortedBlockedTimes) {
    if (blockedTime.startBlockedTime.isAfter(currentTime)) {
      const adjustedEndTime = calculateAdjustedEndTime(blockedTime.startBlockedTime, serviceDuration);

      if (adjustedEndTime.isAfter(currentTime) || adjustedEndTime.isSame(currentTime)) {
        availableTimes.push({
          minPossibleStartTime: currentTime,
          maxPossibleStartTime: adjustedEndTime
        });
      }
    }

    currentTime = blockedTime.endBlockedTime;
  }

  if (currentTime.isBefore(endWorkingTime)) {
    const adjustedEndTime = calculateAdjustedEndTime(endWorkingTime, serviceDuration);
    console.log('Debug - Final adjustedEndTime:', adjustedEndTime.format('YYYY-MM-DD HH:mm:ss'));

    if (adjustedEndTime.isAfter(currentTime) || adjustedEndTime.isSame(currentTime)) {
      availableTimes.push({
        minPossibleStartTime: currentTime,
        maxPossibleStartTime: adjustedEndTime
      });
    }
  }

  return availableTimes;
}

// MAIN FUNCTIONS
function getPeriodWithDaysAndEmployeeAvailability(
  initialParamDate: Date_ISO_Type,
  groupedEmployeeAvailability: GroupedAvailabilityDayType[],
): PeriodWithEmployeeWorkingTimeType[] {
  const initialParamDateObject = dayjs.utc(initialParamDate);
  const today = dayjs().utc().startOf(`day`);

  const firstDayInPeriod = initialParamDateObject.startOf(`week`);
  const lastDayInPeriod = initialParamDateObject.endOf(`week`);

  const period: PeriodWithEmployeeWorkingTimeType[] = [];
  let indexDay = firstDayInPeriod;

   while (indexDay.isBefore(lastDayInPeriod) || indexDay.isSame(lastDayInPeriod, `day`)) {

    /**
     * for now all services will start from today
     * TODO: add ability to start from any day depends on the service
     */
    if (indexDay.isAfter(today) || indexDay.isSame(today, `day`)) {
      const dayOfWeek = indexDay.day();

      const dayAvailability = groupedEmployeeAvailability.find(
        availability => availability.dayId === dayOfWeek
      );

      if (dayAvailability) {
        const dayData: PeriodWithEmployeeWorkingTimeType = {
          day: indexDay.format(DATE_FORMAT) as Date_ISO_Type,
          employees: dayAvailability.employees.map(employee => ({
            employeeId: employee.id,

            /**
             * in DB we store time in German time zone
             * so we need to convert it to UTC here not in the Service
             * because in the service we don't know calendar day (summer/winter time)
             * First we calculate time in german time zone for real calendar date "indexDay"
             * and then convert it to UTC for next calculations
             */
            startWorkingTime: dayjs.tz(`${indexDay.format(DATE_FORMAT)} ${employee.startTime}`, 'Europe/Berlin').utc(),
            endWorkingTime: dayjs.tz(`${indexDay.format(DATE_FORMAT)} ${employee.endTime}`, 'Europe/Berlin').utc(),
          })),
        };
        period.push(dayData);
      }
    }

    indexDay = indexDay.add(1, `day`);
  }

  return period;
}

function combinePeriodWithSavedAppointments(
  period: PeriodWithEmployeeWorkingTimeType[],
  savedAppointments: AppointmentDataType[],
  serviceDuration: Time_HH_MM_SS_Type,
): PeriodWithClearedDaysType[] {
  return period.map(dayData => {
    const dayAppointments = savedAppointments.filter(appointment =>
      dayjs(appointment.date).format(DATE_FORMAT) === dayData.day
    );

    const employeesWithBlockedTimes = dayData.employees.map(employee => {
      const employeeAppointments = dayAppointments.filter(appointment =>
        appointment.employee?.id === employee.employeeId
      );

      const blockedTimes: BlockedTime[] = employeeAppointments.map(appointment => {
        const startTime = dayjs.utc(appointment.timeStart);
        const endTime = dayjs.utc(appointment.timeEnd);

        return {
          startBlockedTime: startTime,
          endBlockedTime: endTime
        };
      });

      const availableTimes = calculateAvailableTimes(
        employee.startWorkingTime,
        employee.endWorkingTime,
        blockedTimes,
        serviceDuration
      );

      return {
        ...employee,
        blockedTimes,
        availableTimes
      };
    });

    return {
      ...dayData,
      employees: employeesWithBlockedTimes
    };
  });
}

function generateTimeSlotsFromAvailableTimes(
  periodWithClearedDays: PeriodWithClearedDaysType[]
): DayWithTimeSlots[] {
  return periodWithClearedDays.map(dayData => {
    const employeesWithTimeSlots: EmployeeWithTimeSlots[] = dayData.employees.map(employee => {
      const availableTimeSlots: AvailableTimeSlot[] = [];

      // Process each available time range for this employee
      employee.availableTimes.forEach(availableTime => {
        let currentTime = availableTime.minPossibleStartTime;
        const endTime = availableTime.maxPossibleStartTime;

        // Generate 30-minute slots within this available time range
        while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
          const slotEndTime = currentTime.add(30, 'minute');

          // Add the slot if currentTime is within available time
          if (currentTime.isSameOrBefore(endTime)) {
            availableTimeSlots.push({
              startTime: currentTime,
              endTime: slotEndTime,
            });
          }

          currentTime = slotEndTime;
        }
      });

      return {
        employeeId: employee.employeeId,
        availableTimeSlots,
      };
    });

    return {
      day: dayData.day,
      employees: employeesWithTimeSlots,
    };
  });
}

function generateGroupedTimeSlots(
  dayWithTimeSlots: DayWithTimeSlots[]
): PeriodWithGroupedTimeslotsType[] {
  return dayWithTimeSlots.map(dayData => {
    // Create a map to group time slots by their time
    const timeSlotMap = new Map<string, TimeslotWithGroupedEmployeeId>();

    // Process each employee's time slots
    dayData.employees.forEach(employee => {
      employee.availableTimeSlots.forEach(timeSlot => {

        /**
         * Convert UTC time to German time zone here to deliver correct time to the client
         */
        const startTime = timeSlot.startTime.tz(`Europe/Berlin`).format(TIME_FORMAT) as Time_HH_MM_SS_Type;

        if (timeSlotMap.has(startTime)) {
          // Add employee ID to existing time slot if not already present
          const existingSlot = timeSlotMap.get(startTime)!;
          if (!existingSlot.employeeId.includes(employee.employeeId)) {
            existingSlot.employeeId.push(employee.employeeId);
          }
        } else {
          // Create new time slot
          timeSlotMap.set(startTime, {
            startTime,
            employeeId: [employee.employeeId]
          });
        }
      });
    });

    // Convert map to array and sort by start time
    const availableTimeslots = Array.from(timeSlotMap.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      day: dayData.day as Date_ISO_Type,
      availableTimeslots
    };
  });
}


// OLD
function getDatesPeriod(
  date: Date_ISO_Type,
  today: dayjs.Dayjs,
  employeeAvailability: EmployeeAvailabilityDataType[]
): GetDatesPeriodResultType {
  const dateObj = dayjs(date, { format: DATE_FORMAT });

  const firstDayInPeriod = dateObj.startOf(`week`);
  const lastDayInPeriod = dateObj.endOf(`week`);

  const datesInRange: Date_ISO_Type[] = [];
  let indexDay = firstDayInPeriod;

  while (indexDay.isBefore(lastDayInPeriod) || indexDay.isSame(lastDayInPeriod, `day`)) {

    // starting from tomorrow and if this days included in the employee availability
    if (
      indexDay.isAfter(today) &&
      employeeAvailability.some(availability => availability.dayId === indexDay.day())
    ) {
      datesInRange.push(indexDay.format(DATE_FORMAT) as Date_ISO_Type);
    }

    indexDay = indexDay.add(1, `day`);
  }

  return {
    datesInDesiredPeriod: datesInRange,
    firstDayInPeriod,
    lastDayInPeriod,
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
  calculateAdjustedEndTime,

  getPeriodWithDaysAndEmployeeAvailability,
  combinePeriodWithSavedAppointments,
  generateTimeSlotsFromAvailableTimes,
  generateGroupedTimeSlots,
};
