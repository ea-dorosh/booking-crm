import { Pool, RowDataPacket } from 'mysql2/promise';
import {
  EmployeeDetailRowType,
  EmployeeDetailDataType,
  EmployeeAvailabilityRow,
  EmployeeAvailabilityDataType,
  GroupedAvailabilityDayType,
  EmployeeValidationErrors,
  UpdateEmployeeResult,
} from '@/@types/employeesTypes.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { AppointmentStatusEnum, EmployeeStatusEnum } from '@/enums/enums.js';
import { checkGoogleCalendarAvailability } from '@/services/googleCalendar/googleCalendarService.js';
import { fromDayjsToMySQLDateTime } from '@/utils/timeUtils.js';

interface CheckEmployeeParams {
  date: string;
  employeeId: number;
  timeStart: dayjs.Dayjs;
  timeEnd: dayjs.Dayjs;
}

interface SavedAppointmentRow extends RowDataPacket {
  id: number;
  employee_id: number;
  date: string;
  time_start: string;
  time_end: string;
}

interface CheckEmployeeAvailabilityResult {
  isEmployeeAvailable: boolean;
}

async function getEmployees(dbPool: Pool, statuses?: string[]): Promise<EmployeeDetailDataType[]> {
  const allowedStatuses = new Set<string>([
    EmployeeStatusEnum.Active,
    EmployeeStatusEnum.Archived,
    EmployeeStatusEnum.Disabled,
  ]);
  const filterStatuses = (Array.isArray(statuses) && statuses.length > 0 ? statuses : [EmployeeStatusEnum.Active])
    .map(s => String(s).toLowerCase())
    .filter(s => allowedStatuses.has(s));

  const finalStatuses = filterStatuses.length > 0 ? filterStatuses : [EmployeeStatusEnum.Active];

  const sql = `
    SELECT
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      image,
      status
    FROM Employees
    WHERE status IN (?)
  `;

  const [results] = await dbPool.query<EmployeeDetailRowType[]>(sql, [finalStatuses]);

  const employees: EmployeeDetailDataType[] = results.map((row) => ({
    employeeId: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    image: row.image
      ? `${process.env.SERVER_API_URL}/images/${row.image}`
      : `${process.env.SERVER_API_URL}/images/no-user-photo.png`,
    status: row.status,
  }));

  return employees;
}

async function getEmployee(dbPool: Pool, employeeId: number): Promise<EmployeeDetailDataType> {
  const sql = `
    SELECT * FROM Employees
    WHERE employee_id = ?
  `;

  const [employeeRows] = await dbPool.query<EmployeeDetailRowType[]>(sql, [employeeId]);

  const employeeData: EmployeeDetailDataType[] = employeeRows.map((row) => ({
    employeeId: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    image: row.image
      ? `${process.env.SERVER_API_URL}/images/${row.image}`
      : `${process.env.SERVER_API_URL}/images/no-user-photo.png`,
    status: row.status,
  }));

  return employeeData[0];
}

async function checkEmployeeTimeNotOverlap(dbPool: Pool, {
  date, employeeId, timeStart, timeEnd,
}: CheckEmployeeParams): Promise<CheckEmployeeAvailabilityResult> {
  const mysqlTimeStart = fromDayjsToMySQLDateTime(timeStart); // in UTC
  const mysqlTimeEnd = fromDayjsToMySQLDateTime(timeEnd); // in UTC

  console.log(`mysqlTimeStart: `, mysqlTimeStart);
  console.log(`mysqlTimeEnd: `, mysqlTimeEnd);

  const checkAvailabilityQuery = `
    SELECT * FROM SavedAppointments
    WHERE employee_id = ?
      AND date = ?
      AND status = ?
      AND (
        (time_start >= ? AND time_start < ?)
        OR
        (time_end > ? AND time_end <= ?)
        OR
        (time_start <= ? AND time_end >= ?)
      )
  `;

  const checkAvailabilityValues = [
    employeeId,
    date,
    AppointmentStatusEnum.Active,
    mysqlTimeStart,
    mysqlTimeEnd,
    mysqlTimeStart,
    mysqlTimeEnd,
    mysqlTimeStart,
    mysqlTimeEnd,
  ];

  const [existingAppointments] = await dbPool.query<SavedAppointmentRow[]>(checkAvailabilityQuery, checkAvailabilityValues);

  const hasDbConflict = existingAppointments.length > 0;
  let hasGoogleCalendarConflict = false;

  try {
    const isGoogleCalendarAvailable = await checkGoogleCalendarAvailability(
      dbPool,
      employeeId,
      timeStart,
      timeEnd,
    );
    hasGoogleCalendarConflict = !isGoogleCalendarAvailable;

    if (hasGoogleCalendarConflict) {
      console.log(`Google Calendar conflict detected for employee ${employeeId} at ${timeEnd.toISOString()}-${timeEnd.toISOString()}`);
    }
  } catch (error) {
    console.error(`Error checking Google Calendar availability for employee ${employeeId}:`, error);
    hasGoogleCalendarConflict = false;
  }

  return { isEmployeeAvailable: !(hasDbConflict || hasGoogleCalendarConflict) };
}

async function getEmployeeAvailability(dbPool: Pool, employeeIds: number[]): Promise<EmployeeAvailabilityDataType[]> {
  const sql = `
    SELECT *
    FROM EmployeeAvailability
    WHERE employee_id IN (?)
  `;

  const [results] = await dbPool.query<EmployeeAvailabilityRow[]>(sql, [employeeIds]);


  const data = results.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    dayId: row.day_id,
    startTime: row.start_time,
    endTime: row.end_time,
    blockStartTimeFirst: row.block_start_time_1,
    blockEndTimeFirst: row.block_end_time_1,
  }));

  return data;
}

async function getGroupEmployeeAvailability(dbPool: Pool, employeeIds: number[]): Promise<GroupedAvailabilityDayType[]> {
  const sql = `
  SELECT *
  FROM EmployeeAvailability
  WHERE employee_id IN (?)
  ORDER BY day_id ASC, start_time ASC
`;

  const [results] = await dbPool.query<EmployeeAvailabilityRow[]>(sql, [employeeIds]);

  if (!results.length) {
    return [];
  }

  const groupedByDay = results.reduce<Record<number, GroupedAvailabilityDayType>>((acc, row) => {
    const {
      employee_id, day_id, start_time, end_time, block_start_time_1, block_end_time_1,
    } = row;

    if (!acc[day_id]) {
      acc[day_id] = {
        dayId: day_id,
        employees: [],
      };
    }

    acc[day_id].employees.push({
      id: employee_id,
      startTime: start_time,
      endTime: end_time,
      blockStartTimeFirst: block_start_time_1,
      blockEndTimeFirst: block_end_time_1,
    });

    return acc;
  }, {});

  return Object.values(groupedByDay).sort((a, b) => a.dayId - b.dayId);
}

async function updateEmployeeStatus(dbPool: Pool, employeeId: number, status: string): Promise<UpdateEmployeeResult> {
  // basic validation for status
  const allowedStatuses = new Set<string>([
    EmployeeStatusEnum.Active,
    EmployeeStatusEnum.Archived,
    EmployeeStatusEnum.Disabled,
  ]);
  if (!allowedStatuses.has(status)) {
    return {
      employeeId: null,
      validationErrors: { status: `Invalid status value` } as unknown as EmployeeValidationErrors,
    };
  }

  const updateStatusQuery = `
    UPDATE Employees
    SET status = ?
    WHERE employee_id = ?;
  `;

  try {
    await dbPool.query(updateStatusQuery, [status, employeeId]);

    return {
      employeeId,
      validationErrors: null,
    };
  } catch (error) {
    throw error;
  }
}

export {
  getEmployees,
  getEmployee,
  getEmployeeAvailability,
  getGroupEmployeeAvailability,
  checkEmployeeTimeNotOverlap,
  updateEmployeeStatus,
};
