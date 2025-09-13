import { Pool } from 'mysql2/promise';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getEmployeeWorkingTimes } from '@/services/employees/employeesScheduleService.js';

export interface EmployeesWorkingTimesForDayItem {
  employeeId: number;
  startTime: string;
  endTime: string;
  blockStartTimeFirst: string | null;
  blockEndTimeFirst: string | null;
}

export interface EmployeesWorkingTimesForDay {
  date: Date_ISO_Type;
  employees: EmployeesWorkingTimesForDayItem[];
}

export async function getEmployeesWorkingTimesRange(
  databasePool: Pool,
  employeeIds: number[],
  startDateIso: Date_ISO_Type,
  endDateIso: Date_ISO_Type,
): Promise<EmployeesWorkingTimesForDay[]> {
  const startDate = dayjs.utc(startDateIso).startOf(`day`);
  const endDate = dayjs.utc(endDateIso).startOf(`day`);

  const result: EmployeesWorkingTimesForDay[] = [];

  for (let current = startDate; current.isSame(endDate) || current.isBefore(endDate); current = current.add(1, `day`)) {
    const dateIso = current.format(`YYYY-MM-DD`) as Date_ISO_Type;
    const employees: EmployeesWorkingTimesForDayItem[] = [];

    for (const employeeId of employeeIds) {
      const workingTimes = await getEmployeeWorkingTimes(databasePool, employeeId, dateIso);
      if (workingTimes.startTime && workingTimes.endTime) {
        employees.push({
          employeeId,
          startTime: workingTimes.startTime,
          endTime: workingTimes.endTime,
          blockStartTimeFirst: workingTimes.blockStartTimeFirst,
          blockEndTimeFirst: workingTimes.blockEndTimeFirst,
        });
      }
    }

    result.push({
      date: dateIso, employees,
    });
  }

  return result;
}


