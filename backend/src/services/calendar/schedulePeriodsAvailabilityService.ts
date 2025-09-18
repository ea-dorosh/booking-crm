import { Pool } from 'mysql2/promise';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { GroupedAvailabilityDayType } from '@/@types/employeesTypes.js';
import { getEmployeeWorkingTimes } from '@/services/employees/employeesScheduleService.js';
import { getEmployeeAdvanceBookingTime } from '@/services/employees/employeesService.js';

/**
 * Build grouped employee availability for the week of the provided date
 * using schedule periods configuration (FEATURE_FLAGS.employeeSchedulePeriods).
 */
export async function buildGroupedAvailabilityForWeek(
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  employeeIds: number[],
): Promise<GroupedAvailabilityDayType[]> {
  // Parse the ISO date as UTC to avoid local-to-UTC day shifts
  const initialDateObject = dayjs.utc(paramDate);
  const firstDayInPeriod = initialDateObject.startOf(`week`);
  const lastDayInPeriod = initialDateObject.endOf(`week`);

  const groupedByDay: GroupedAvailabilityDayType[] = [];
  let indexDay = firstDayInPeriod;

  while (indexDay.isBefore(lastDayInPeriod) || indexDay.isSame(lastDayInPeriod, `day`)) {
    const dayId = indexDay.day();
    const dateIso = indexDay.format(`YYYY-MM-DD`) as Date_ISO_Type;

    // Load working times for each employee for this exact day
    const employeesForDay: GroupedAvailabilityDayType[`employees`] = [];
    for (const employeeId of employeeIds) {
      const workingTimes = await getEmployeeWorkingTimes(dbPool, employeeId, dateIso);
      if (workingTimes.startTime && workingTimes.endTime) {
        // Get employee advance booking time using dedicated service
        const advanceBookingTime = await getEmployeeAdvanceBookingTime(dbPool, employeeId);

        employeesForDay.push({
          id: employeeId,
          startTime: workingTimes.startTime,
          endTime: workingTimes.endTime,
          blockStartTimeFirst: workingTimes.blockStartTimeFirst,
          blockEndTimeFirst: workingTimes.blockEndTimeFirst,
          advanceBookingTime,
        });
      }
    }

    if (employeesForDay.length > 0) {
      groupedByDay.push({
        dayId,
        employees: employeesForDay,
      });
    }

    indexDay = indexDay.add(1, `day`);
  }

  return groupedByDay;
}


