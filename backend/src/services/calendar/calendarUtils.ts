import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { AppointmentDataType } from '@/@types/appointmentsTypes.js';
import { GroupedAvailabilityDayType } from '@/@types/employeesTypes.js';

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

export interface EmployeeWithWorkingTimesType {
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
  employeeId: number[];
  startTime: Time_HH_MM_SS_Type; // in german time zone
}

interface TimeslotWithGroupedEmployeeIdForTwoServices {
  employeeId: number[];
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
 * @param baseTime - time in HH:mm:ss format
 * @param serviceDuration - service duration in HH:mm:ss format
 * @returns adjusted time in HH:mm:ss format
 */
const calculateAdjustedEndTime = (baseTime: dayjs.Dayjs, serviceDuration: Time_HH_MM_SS_Type): dayjs.Dayjs => {
  const result = baseTime
    .subtract(dayjs(serviceDuration, TIME_FORMAT).hour(), `hour`)
    .subtract(dayjs(serviceDuration, TIME_FORMAT).minute(), `minute`)
    .subtract(dayjs(serviceDuration, TIME_FORMAT).second(), `second`)
    .utc();

  return result;
}

const calculateAvailableTimes = (
  startWorkingTime: dayjs.Dayjs,
  endWorkingTime: dayjs.Dayjs,
  blockedTimes: BlockedTime[],
  serviceDuration: Time_HH_MM_SS_Type
): AvailableTime[] => {
  const availableTimes: AvailableTime[] = [];

  if (blockedTimes.length === 0) {
    const adjustedEndTime = calculateAdjustedEndTime(endWorkingTime, serviceDuration);

    if (adjustedEndTime.isAfter(startWorkingTime)) {
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

    if (adjustedEndTime.isAfter(currentTime) || adjustedEndTime.isSame(currentTime)) {
      availableTimes.push({
        minPossibleStartTime: currentTime,
        maxPossibleStartTime: adjustedEndTime
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

function normalizeSavedAppointments(savedAppointments: AppointmentDataType[]): NormalizedAppointmentData[] {
  return savedAppointments.map(appointment => ({
    date: appointment.date,
    timeStart: appointment.timeStart,
    timeEnd: appointment.timeEnd,
    employeeId: appointment.employee.id
  }));
}

function normalizeGoogleCalendarEvents(
  googleEvents: { start: string; end: string; summary: string }[],
  employeeId: number
): NormalizedAppointmentData[] {
  return googleEvents.map(event => ({
    date: dayjs(event.start).format(DATE_FORMAT),
    timeStart: event.start,
    timeEnd: event.end,
    employeeId: employeeId,
  }));
}

/**
 * Normalize Google Calendar events for specific employees
 */
function normalizeGoogleEventsForEmployees(
  googleCalendarEvents: { start: string; end: string; summary: string }[],
  periodWithDaysAndEmployeeAvailability: any[]
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

function combinePeriodWithNormalizedAppointments(
  period: PeriodWithEmployeeWorkingTimeType[],
  normalizedAppointments: NormalizedAppointmentData[],
  serviceDurationWithBuffer: Time_HH_MM_SS_Type,
  serviceDuration: Time_HH_MM_SS_Type,
  serviceId: number,
): PeriodWithClearedDaysType[] {
  return period.map(dayData => {
    const dayAppointments = normalizedAppointments.filter(appointment =>
      dayjs(appointment.date).format(DATE_FORMAT) === dayData.day
    );

    const employeesWithBlockedTimes = dayData.employees.map(employee => {
      const employeeAppointments = dayAppointments.filter(appointment =>
        appointment.employeeId === employee.employeeId
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
        serviceDurationWithBuffer,
      );

      return {
        ...employee,
        blockedTimes,
        availableTimes
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

function combineAndFilterTimeSlotsDataFromTwoServices(
  timeSlotsDataForFirstService: DayWithTimeSlots[],
  timeSlotsDataForSecondService: DayWithTimeSlots[]
): FilteredTimeSlotsDataForTwoServicesType[] {
  const result: FilteredTimeSlotsDataForTwoServicesType[] = [];

  // Process each day
  timeSlotsDataForFirstService.forEach(firstServiceDay => {
    // Find corresponding day in second service
    const secondServiceDay = timeSlotsDataForSecondService.find(
      day => day.day === firstServiceDay.day
    );

    if (!secondServiceDay) {
      // If no corresponding day in second service, add empty result
      result.push({
        day: firstServiceDay.day,
        availableTimeSlots: []
      });
      return;
    }

    const combinedTimeSlots: CombinedTimeSlot[] = [];

    // For each employee in first service
    firstServiceDay.employees.forEach(firstEmployee => {
      // For each time slot of first employee
      firstEmployee.availableTimeSlots.forEach(firstTimeSlot => {
        // Calculate when first service will end
        const durationParts = firstServiceDay.serviceDuration.split(':');
        const hours = parseInt(durationParts[0]);
        const minutes = parseInt(durationParts[1]);
        const seconds = parseInt(durationParts[2]);

        const firstServiceEndTime = firstTimeSlot.startTime
          .add(hours, 'hour')
          .add(minutes, 'minute')
          .add(seconds, 'second');

        // Find all employees in second service who can start at this end time
        const availableSecondEmployees: number[] = [];
        const matchingSlots: AvailableTimeSlot[] = [];

        secondServiceDay.employees.forEach(secondEmployee => {
          const matchingSlot = secondEmployee.availableTimeSlots.find(
            slot => slot.startTime.isSame(firstServiceEndTime)
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
            slot => slot.startTime === firstTimeSlot.startTime.toISOString()
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
              }
            };
            combinedTimeSlots.push(newSlot);
          }
        }
      });
    });

    // Сортируем слоты по времени начала первого сервиса
    const sortedCombinedTimeSlots = combinedTimeSlots.sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    result.push({
      day: firstServiceDay.day,
      availableTimeSlots: sortedCombinedTimeSlots
    });
  });

  return result;
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
      serviceDuration: dayData.serviceDuration,
      serviceId: dayData.serviceId,
    };
  });
}

function generateGroupedTimeSlotsForTwoServices(
  filteredTimeSlotsData: FilteredTimeSlotsDataForTwoServicesType[]
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
          if (!existingSlot.employeeId.includes(employeeId)) {
            existingSlot.employeeId.push(employeeId);
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
          employeeId: [...timeSlot.employeeIds],
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
      availableTimeslots
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
};
