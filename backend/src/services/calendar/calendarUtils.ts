import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { AppointmentDataType } from '@/@types/appointmentsTypes.js';
import { GroupedAvailabilityDayType } from '@/@types/employeesTypes.js';
import { ADVANCE_BOOKING_NEXT_DAY, TimeslotIntervalEnum } from '@/enums/enums.js';

const TIME_FORMAT = `HH:mm:ss`;
const DATE_FORMAT = `YYYY-MM-DD`;

interface NormalizedAppointmentData {
  date: string;
  timeStart: string;
  timeEnd: string;
  employeeId: number;
}

interface BlockedTime {
  startBlockedTime: dayjs.Dayjs;
  endBlockedTime: dayjs.Dayjs;
}

interface AvailableTime {
  minPossibleStartTime: dayjs.Dayjs;
  maxPossibleStartTime: dayjs.Dayjs;
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

export interface PeriodWithClearedDaysType {
  day: Date_ISO_Type;
  employees: EmployeeWithBlockedAndAvailableTimesType[];
  serviceDuration: Time_HH_MM_SS_Type;
  serviceId: number;
}

interface PauseTime {
  startPauseTime: dayjs.Dayjs;
  endPauseTime: dayjs.Dayjs;
}

export interface EmployeeWithWorkingTimesType {
  employeeId: number;
  startWorkingTime: dayjs.Dayjs;
  endWorkingTime: dayjs.Dayjs;
  pauseTimes: PauseTime[];
  advanceBookingTime: string; // can be HH:MM:SS or 'next_day'
  timeslotInterval: TimeslotIntervalEnum; // defaults to TimeslotIntervalEnum.Thirty
}

interface EmployeeWithBlockedAndAvailableTimesType {
  employeeId: number;
  startWorkingTime: dayjs.Dayjs;
  endWorkingTime: dayjs.Dayjs;
  blockedTimes: BlockedTime[];
  availableTimes: AvailableTime[];
  timeslotInterval: TimeslotIntervalEnum; // defaults to TimeslotIntervalEnum.Thirty
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

export interface DayWithTimeSlots {
  day: Date_ISO_Type;
  serviceDuration: Time_HH_MM_SS_Type;
  serviceId: number;
  employees: EmployeeWithTimeSlots[];
}

// New types for combined time slots result
export interface CombinedTimeSlot {
  startTime: string;
  endTime: string;
  employeeIds: number[];
  serviceId: number;
  secondService?: {
    startTime: string;
    endTime: string;
    employeeIds: number[];
    serviceId: number;
  };
}

export interface FilteredTimeSlotsDataForTwoServicesType {
  day: Date_ISO_Type;
  availableTimeSlots: CombinedTimeSlot[];
}

export interface PeriodWithGroupedTimeslotsType {
  day: Date_ISO_Type;
  availableTimeslots: TimeslotWithGroupedEmployeeId[];
}

interface TimeslotWithGroupedEmployeeId {
  employeeIds: number[];
  startTime: Time_HH_MM_SS_Type; // in german time zone
}

interface TimeslotWithGroupedEmployeeIdForTwoServices {
  employeeIds: number[];
  startTime: Time_HH_MM_SS_Type; // in german time zone
  serviceId: number;
  secondService?: {
    startTime: Time_HH_MM_SS_Type; // in german time zone
    employeeIds: number[];
    serviceId: number;
  };
}

export interface PeriodWithGroupedTimeslotsForTwoServicesType {
  day: Date_ISO_Type;
  availableTimeslots: TimeslotWithGroupedEmployeeIdForTwoServices[];
}

// HELPER FUNCTIONS
/**
 * Calculate adjusted end time by subtracting service duration from a given time
 * @param baseTime - time in Dayjs UTC format
 * @param serviceDuration - service duration in HH:mm:ss format
 * @returns adjusted time in HH:mm:ss format
 */
const calculateAdjustedEndTime = (baseTime: dayjs.Dayjs, serviceDuration: Time_HH_MM_SS_Type): dayjs.Dayjs => {
  const serviceTime = dayjs.utc(serviceDuration, TIME_FORMAT);

  const result = baseTime
    .subtract(serviceTime.hour(), `hour`)
    .subtract(serviceTime.minute(), `minute`)
    .subtract(serviceTime.second(), `second`)
    .utc();

  return result;
}

const calculateAvailableTimes = (
  startWorkingTime: dayjs.Dayjs,
  endWorkingTime: dayjs.Dayjs,
  blockedTimes: BlockedTime[],
  serviceDuration: Time_HH_MM_SS_Type,
): AvailableTime[] => {
  const availableTimes: AvailableTime[] = [];

  if (blockedTimes.length === 0) {
    const adjustedEndTime = calculateAdjustedEndTime(endWorkingTime, serviceDuration);

    if (adjustedEndTime.isAfter(startWorkingTime)) {
      return [{
        minPossibleStartTime: startWorkingTime,
        maxPossibleStartTime: adjustedEndTime,
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
          maxPossibleStartTime: adjustedEndTime,
        });
      }
    }

    // Only move currentTime forward, never backward - this handles overlapping blocked periods
    currentTime = dayjs.max(currentTime, blockedTime.endBlockedTime);
  }

  if (currentTime.isBefore(endWorkingTime)) {
    const adjustedEndTime = calculateAdjustedEndTime(endWorkingTime, serviceDuration);

    if (adjustedEndTime.isAfter(currentTime) || adjustedEndTime.isSame(currentTime)) {
      availableTimes.push({
        minPossibleStartTime: currentTime,
        maxPossibleStartTime: adjustedEndTime,
      });
    }
  }

  return availableTimes;
}

const getAppointmentEndTime = (startTime: dayjs.Dayjs, serviceDuration: Time_HH_MM_SS_Type): dayjs.Dayjs => {
  const endTime = startTime
    .add(dayjs(serviceDuration, TIME_FORMAT).hour(), `hour`)
    .add(dayjs(serviceDuration, TIME_FORMAT).minute(), `minute`)
    .add(dayjs(serviceDuration, TIME_FORMAT).second(), `second`)
    .utc();

  return endTime;
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
        availability => availability.dayId === dayOfWeek,
      );

      if (dayAvailability) {
        const dayData: PeriodWithEmployeeWorkingTimeType = {
          day: indexDay.format(DATE_FORMAT) as Date_ISO_Type,
          employees: dayAvailability.employees.map(employee => {

            const pauseTimes: PauseTime[] = [];
            if (employee.blockStartTimeFirst && employee.blockEndTimeFirst) {
              pauseTimes.push({
                startPauseTime: dayjs.tz(`${indexDay.format(DATE_FORMAT)} ${employee.blockStartTimeFirst}`, `Europe/Berlin`).utc(),
                endPauseTime: dayjs.tz(`${indexDay.format(DATE_FORMAT)} ${employee.blockEndTimeFirst}`, `Europe/Berlin`).utc(),
              });
            }

            return {
              employeeId: employee.id,

              /**
             * in DB we store time in German time zone
             * so we need to convert it to UTC here not in the Service
             * because in the service we don't know calendar day (summer/winter time)
             * First we calculate time in german time zone for real calendar date "indexDay"
             * and then convert it to UTC for next calculations
             */
              startWorkingTime: dayjs.tz(`${indexDay.format(DATE_FORMAT)} ${employee.startTime}`, `Europe/Berlin`).utc(),
              endWorkingTime: dayjs.tz(`${indexDay.format(DATE_FORMAT)} ${employee.endTime}`, `Europe/Berlin`).utc(),
              pauseTimes,
              advanceBookingTime: employee.advanceBookingTime,
              timeslotInterval: employee.timeslotInterval,
            }
          }),
        };

        period.push(dayData);
      }
    }

    indexDay = indexDay.add(1, `day`);
  }

  return period;
}

function normalizeSavedAppointments(savedAppointments: AppointmentDataType[]): NormalizedAppointmentData[] {
  return savedAppointments.map(appointment => ({
    date: appointment.date,
    timeStart: appointment.timeStart,
    timeEnd: appointment.timeEnd,
    employeeId: appointment.employee.id,
  }));
}

function normalizeGoogleCalendarEvents(
  googleEvents: { start: string; end: string; summary: string }[],
  employeeId: number,
): NormalizedAppointmentData[] {
  return googleEvents.map(event => ({
    date: dayjs(event.start).format(DATE_FORMAT),
    timeStart: event.start,
    timeEnd: event.end,
    employeeId,
  }));
}

/**
 * Normalize Google Calendar events for specific employees
 */
function normalizeGoogleEventsForEmployees(
  googleCalendarEvents: { start: string; end: string; summary: string }[],
  periodWithDaysAndEmployeeAvailability: any[],
): any[] {
  const normalizedGoogleEvents: any[] = [];

  if (periodWithDaysAndEmployeeAvailability.length === 0) {
    return normalizedGoogleEvents;
  }

  // Create employee dates map for normalization
  const employeeDatesMapForNormalization = new Map<number, string[]>();
  periodWithDaysAndEmployeeAvailability.forEach(dayData => {
    dayData.employees.forEach((employee: any) => {
      if (!employeeDatesMapForNormalization.has(employee.employeeId)) {
        employeeDatesMapForNormalization.set(employee.employeeId, []);
      }
      employeeDatesMapForNormalization.get(employee.employeeId)!.push(dayData.day);
    });
  });

  // Normalize events for each employee
  for (const [employeeId, dates] of employeeDatesMapForNormalization) {
    const employeeGoogleEvents = googleCalendarEvents.filter(event => {
      const eventDate = dayjs(event.start).format(DATE_FORMAT);
      return dates.includes(eventDate);
    });

    if (employeeGoogleEvents.length > 0) {
      const normalizedEvents = normalizeGoogleCalendarEvents(employeeGoogleEvents, employeeId);
      normalizedGoogleEvents.push(...normalizedEvents);
    }
  }

  return normalizedGoogleEvents;
}

/**
 * Normalize pause times from employee availability into generic normalized appointments
 * so they are handled as blocked times downstream
 */
function normalizePauseTimesForEmployees(
  periodWithDaysAndEmployeeAvailability: PeriodWithEmployeeWorkingTimeType[],
): NormalizedAppointmentData[] {
  const normalizedPauseTimes: NormalizedAppointmentData[] = [];

  for (const dayData of periodWithDaysAndEmployeeAvailability) {
    for (const employee of dayData.employees) {
      if (!employee.pauseTimes || employee.pauseTimes.length === 0) continue;

      for (const pause of employee.pauseTimes) {
        normalizedPauseTimes.push({
          date: dayData.day,
          timeStart: pause.startPauseTime.toISOString(),
          timeEnd: pause.endPauseTime.toISOString(),
          employeeId: employee.employeeId,
        });
      }
    }
  }

  return normalizedPauseTimes;
}

function combinePeriodWithNormalizedAppointments(
  period: PeriodWithEmployeeWorkingTimeType[],
  normalizedAppointments: NormalizedAppointmentData[],
  serviceDurationWithBuffer: Time_HH_MM_SS_Type,
  serviceDuration: Time_HH_MM_SS_Type,
  serviceId: number,
): PeriodWithClearedDaysType[] {
  return period.map(dayData => {
    const dayAppointments = normalizedAppointments.filter(appointment =>
      dayjs(appointment.date).format(DATE_FORMAT) === dayData.day,
    );
    const employeesWithBlockedTimes = dayData.employees.map(employee => {
      const employeeAppointments = dayAppointments.filter(appointment =>
        appointment.employeeId === employee.employeeId,
      );

      const blockedTimes: BlockedTime[] = employeeAppointments.map(appointment => {
        const startTime = dayjs.utc(appointment.timeStart);
        const endTime = dayjs.utc(appointment.timeEnd);

        return {
          startBlockedTime: startTime,
          endBlockedTime: endTime,
        };
      });

      // Add blocked period for current time + advance booking time if this is today
      const today = dayjs().utc().format(DATE_FORMAT);
      if (dayData.day === today) {
        const now = dayjs().utc();

        if (employee.advanceBookingTime === ADVANCE_BOOKING_NEXT_DAY) {
          // If 'next_day' is set, block the entire current day
          blockedTimes.push({
            startBlockedTime: employee.startWorkingTime,
            endBlockedTime: employee.endWorkingTime,
          });
        } else {
          // Parse advance booking time (HH:MM:SS format) and add to current time
          const [hours, minutes, seconds] = employee.advanceBookingTime.split(`:`).map(Number);
          const totalMinutes = hours * 60 + minutes + Math.floor(seconds / 60);
          const nowPlusAdvanceTime = now.add(totalMinutes, `minute`);

          // Only block if nowPlusAdvanceTime is within the working day and after start time
          if (nowPlusAdvanceTime.isAfter(employee.startWorkingTime) && nowPlusAdvanceTime.isBefore(employee.endWorkingTime)) {
            blockedTimes.push({
              startBlockedTime: employee.startWorkingTime,
              endBlockedTime: nowPlusAdvanceTime,
            });
          } else if (nowPlusAdvanceTime.isAfter(employee.endWorkingTime)) {
            // If advance time goes beyond working hours, block the entire day
            blockedTimes.push({
              startBlockedTime: employee.startWorkingTime,
              endBlockedTime: employee.endWorkingTime,
            });
          }
        }
      }

      const availableTimes = calculateAvailableTimes(
        employee.startWorkingTime,
        employee.endWorkingTime,
        blockedTimes,
        serviceDurationWithBuffer,
      );



      return {
        ...employee,
        blockedTimes,
        availableTimes,
      };
    });

    return {
      ...dayData,
      employees: employeesWithBlockedTimes,
      serviceDuration,
      serviceId,
    };
  });
}

function generateTimeSlotsFromAvailableTimes(
  periodWithClearedDays: PeriodWithClearedDaysType[],
): DayWithTimeSlots[] {
  return periodWithClearedDays.map(dayData => {
    const employeesWithTimeSlots: EmployeeWithTimeSlots[] = dayData.employees.map(employee => {
      const availableTimeSlots: AvailableTimeSlot[] = [];

      // Get timeslot interval for this employee (default to 30 for backward compatibility)
      const intervalMinutes = parseInt(employee.timeslotInterval, 10);

      // Process each available time range for this employee
      employee.availableTimes.forEach(availableTime => {
        // Round start time to next 15-minute interval (00, 15, 30, 45) - always use 15-min rounding
        const startMinutes = availableTime.minPossibleStartTime.minute();
        const roundedMinutes = Math.ceil(startMinutes / 15) * 15;
        let currentTime = availableTime.minPossibleStartTime
          .minute(roundedMinutes % 60)
          .second(0)
          .millisecond(0);

        // Handle hour overflow if minutes rounded to 60
        if (roundedMinutes >= 60) {
          currentTime = currentTime.add(1, `hour`).minute(0);
        }

        const endTime = availableTime.maxPossibleStartTime;

        // Generate time slots based on timeslot interval
        let isFirstSlot = true;
        while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
          let slotEndTime: dayjs.Dayjs;

          if (isFirstSlot) {
            // First slot logic - make it short if not on proper boundary
            slotEndTime = calculateFirstSlotEndTime(currentTime, intervalMinutes);
            isFirstSlot = false;
          } else {
            // All subsequent slots are full interval duration
            slotEndTime = currentTime.add(intervalMinutes, `minute`);
          }

          // Add the slot if it can start at or before maxPossibleStartTime
          // maxPossibleStartTime is the last moment when a service can START
          if (currentTime.isSameOrBefore(endTime)) {
            availableTimeSlots.push({
              startTime: currentTime,
              endTime: slotEndTime,
            });
          }

          // Move to next slot - use the end time of current slot as start of next slot
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
      serviceDuration: dayData.serviceDuration,
      serviceId: dayData.serviceId,
    };
  });
}

/**
 * Calculate the end time for the first slot based on timeslot interval
 * First slot is shortened if it doesn't start on proper boundary
 */
function calculateFirstSlotEndTime(currentTime: dayjs.Dayjs, intervalMinutes: number): dayjs.Dayjs {
  const currentMinutes = currentTime.minute();

  if (intervalMinutes === parseInt(TimeslotIntervalEnum.Fifteen, 10)) {
    // For 15-minute intervals, all 15-minute boundaries are valid (00, 15, 30, 45)
    // Just add 15 minutes
    return currentTime.add(15, `minute`);
  } else if (intervalMinutes === parseInt(TimeslotIntervalEnum.Thirty, 10)) {
    // For 30-minute intervals, preserve current behavior
    if (currentMinutes === 15 || currentMinutes === 45) {
      // First slot is short (until next :00 or :30)
      return currentMinutes === 15
        ? currentTime.minute(30).second(0).millisecond(0)  // 15 -> 30
        : currentTime.add(1, `hour`).minute(0).second(0).millisecond(0);  // 45 -> :00 next hour
    } else {
      // First slot is full 30 minutes (starts at :00 or :30)
      return currentTime.add(30, `minute`);
    }
  } else if (intervalMinutes === parseInt(TimeslotIntervalEnum.Sixty, 10)) {
    // For 60-minute intervals, only :00 is proper boundary
    if (currentMinutes === 0) {
      // Already on hour boundary, make full 60-minute slot
      return currentTime.add(60, `minute`);
    } else {
      // Not on hour boundary, make short slot to next hour
      return currentTime.add(1, `hour`).minute(0).second(0).millisecond(0);
    }
  } else {
    // Fallback for any other interval (shouldn't happen with current enum)
    return currentTime.add(intervalMinutes, `minute`);
  }
}

function combineAndFilterTimeSlotsDataFromTwoServices(
  timeSlotsDataForFirstService: DayWithTimeSlots[],
  timeSlotsDataForSecondService: DayWithTimeSlots[],
): FilteredTimeSlotsDataForTwoServicesType[] {
  const result: FilteredTimeSlotsDataForTwoServicesType[] = [];

  // Process each day
  timeSlotsDataForFirstService.forEach(firstServiceDay => {
    // Find corresponding day in second service
    const secondServiceDay = timeSlotsDataForSecondService.find(
      day => day.day === firstServiceDay.day,
    );

    if (!secondServiceDay) {
      // If no corresponding day in second service, add empty result
      result.push({
        day: firstServiceDay.day,
        availableTimeSlots: [],
      });
      return;
    }

    const combinedTimeSlots: CombinedTimeSlot[] = [];

    // For each employee in first service
    firstServiceDay.employees.forEach(firstEmployee => {
      // For each time slot of first employee
      firstEmployee.availableTimeSlots.forEach(firstTimeSlot => {
        // Calculate when first service will end
        const durationParts = firstServiceDay.serviceDuration.split(`:`);
        const hours = parseInt(durationParts[0]);
        const minutes = parseInt(durationParts[1]);
        const seconds = parseInt(durationParts[2]);

        const firstServiceEndTime = firstTimeSlot.startTime
          .add(hours, `hour`)
          .add(minutes, `minute`)
          .add(seconds, `second`);

        // Find all employees in second service who can start at this end time
        const availableSecondEmployees: number[] = [];
        const matchingSlots: AvailableTimeSlot[] = [];

        secondServiceDay.employees.forEach(secondEmployee => {
          const matchingSlot = secondEmployee.availableTimeSlots.find(
            slot => slot.startTime.isSameOrAfter(firstServiceEndTime) &&
                   slot.startTime.isSameOrBefore(firstServiceEndTime.add(30, `minute`)),
          );

          if (matchingSlot) {
            availableSecondEmployees.push(secondEmployee.employeeId);
            matchingSlots.push(matchingSlot);
          }
        });

        // If we found employees who can do second service
        if (availableSecondEmployees.length > 0 && matchingSlots.length > 0) {
          const secondServiceSlot = matchingSlots[0]; // Use first matching slot

          // Check if this combination already exists
          const existingSlot = combinedTimeSlots.find(
            slot => slot.startTime === firstTimeSlot.startTime.toISOString(),
          );

          if (existingSlot) {
            // Add this employee to existing slot
            if (!existingSlot.employeeIds.includes(firstEmployee.employeeId)) {
              existingSlot.employeeIds.push(firstEmployee.employeeId);
            }
          } else {
            // Create new combined slot
            const newSlot = {
              startTime: firstTimeSlot.startTime.toISOString(),
              endTime: firstTimeSlot.endTime.toISOString(),
              employeeIds: [firstEmployee.employeeId],
              serviceId: firstServiceDay.serviceId,
              secondService: {
                startTime: secondServiceSlot.startTime.toISOString(),
                endTime: secondServiceSlot.endTime.toISOString(),
                employeeIds: [...availableSecondEmployees],
                serviceId: secondServiceDay.serviceId,
              },
            };
            combinedTimeSlots.push(newSlot);
          }
        }
      });
    });

    const sortedCombinedTimeSlots = combinedTimeSlots.sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    result.push({
      day: firstServiceDay.day,
      availableTimeSlots: sortedCombinedTimeSlots,
    });
  });

  return result;
}

function generateGroupedTimeSlotsForTwoServices(
  filteredTimeSlotsData: FilteredTimeSlotsDataForTwoServicesType[],
): PeriodWithGroupedTimeslotsForTwoServicesType[] {
  return filteredTimeSlotsData.map(dayData => {
    // Create a map to group time slots by their first service start time
    const timeSlotMap = new Map<string, TimeslotWithGroupedEmployeeIdForTwoServices>();

    // Process each time slot
    dayData.availableTimeSlots.forEach(timeSlot => {
      /**
       * Convert UTC time to German time zone here to deliver correct time to the client
       */
      const firstServiceStartTime = dayjs(timeSlot.startTime).tz(`Europe/Berlin`).format(TIME_FORMAT) as Time_HH_MM_SS_Type;
      const secondServiceStartTime = timeSlot.secondService
        ? dayjs(timeSlot.secondService.startTime).tz(`Europe/Berlin`).format(TIME_FORMAT) as Time_HH_MM_SS_Type
        : undefined;

      if (timeSlotMap.has(firstServiceStartTime)) {
        // Add employee IDs to existing time slot if not already present
        const existingSlot = timeSlotMap.get(firstServiceStartTime)!;

        // Merge first service employee IDs
        timeSlot.employeeIds.forEach(employeeId => {
          if (!existingSlot.employeeIds.includes(employeeId)) {
            existingSlot.employeeIds.push(employeeId);
          }
        });

        // Merge second service employee IDs if second service exists
        if (timeSlot.secondService && existingSlot.secondService) {
          timeSlot.secondService.employeeIds.forEach(employeeId => {
            if (!existingSlot.secondService!.employeeIds.includes(employeeId)) {
              existingSlot.secondService!.employeeIds.push(employeeId);
            }
          });
        }
      } else {
        // Create new time slot
        const newSlot: TimeslotWithGroupedEmployeeIdForTwoServices = {
          startTime: firstServiceStartTime,
          employeeIds: [...timeSlot.employeeIds],
          serviceId: timeSlot.serviceId,
        };

        // Add second service if it exists
        if (timeSlot.secondService && secondServiceStartTime) {
          newSlot.secondService = {
            startTime: secondServiceStartTime,
            employeeIds: [...timeSlot.secondService.employeeIds],
            serviceId: timeSlot.secondService.serviceId,
          };
        }

        timeSlotMap.set(firstServiceStartTime, newSlot);
      }
    });

    // Convert map to array and sort by start time
    const availableTimeslots = Array.from(timeSlotMap.values())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      day: dayData.day as Date_ISO_Type,
      availableTimeslots,
    };
  });
}

export {
  calculateAdjustedEndTime,
  calculateAvailableTimes, // export for tests
  combinePeriodWithNormalizedAppointments,
  combineAndFilterTimeSlotsDataFromTwoServices,
  generateGroupedTimeSlotsForTwoServices,
  generateTimeSlotsFromAvailableTimes,
  getAppointmentEndTime,
  getPeriodWithDaysAndEmployeeAvailability,
  normalizeSavedAppointments,
  normalizeGoogleEventsForEmployees,
  normalizePauseTimesForEmployees,
};
