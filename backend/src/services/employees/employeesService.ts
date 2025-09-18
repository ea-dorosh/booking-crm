import { Pool, RowDataPacket } from 'mysql2/promise';
import {
  EmployeeDetailRowType,
  EmployeeDetailDataType,
  EmployeeValidationErrors,
  UpdateEmployeeResult,
} from '@/@types/employeesTypes.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { AppointmentStatusEnum, EmployeeStatusEnum, ADVANCE_BOOKING_NEXT_DAY } from '@/enums/enums.js';
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
      status,
      advance_booking_time
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
    // Convert HH:MM:SS back to HH:MM for frontend, except for special values
    advanceBookingTime: row.advance_booking_time === ADVANCE_BOOKING_NEXT_DAY
      ? ADVANCE_BOOKING_NEXT_DAY
      : (row.advance_booking_time ? row.advance_booking_time.slice(0, 5) : `00:30`),
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
    // Convert HH:MM:SS back to HH:MM for frontend, except for special values
    advanceBookingTime: row.advance_booking_time === ADVANCE_BOOKING_NEXT_DAY
      ? ADVANCE_BOOKING_NEXT_DAY
      : (row.advance_booking_time ? row.advance_booking_time.slice(0, 5) : `00:30`),
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

// Legacy EmployeeAvailability functions removed

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

async function getEmployeeAdvanceBookingTime(dbPool: Pool, employeeId: number): Promise<string> {
  interface EmployeeAdvanceTimeRow extends RowDataPacket {
    advance_booking_time: string;
  }

  const sql = `
    SELECT advance_booking_time
    FROM Employees
    WHERE employee_id = ?
  `;

  try {
    const [employeeRows] = await dbPool.query<EmployeeAdvanceTimeRow[]>(sql, [employeeId]);
    return employeeRows[0]?.advance_booking_time || `00:30:00`;
  } catch (error) {
    console.error(`Error fetching advance booking time for employee ${employeeId}:`, error);
    return `00:30:00`; // fallback to default
  }
}

export {
  getEmployees,
  getEmployee,
  checkEmployeeTimeNotOverlap,
  updateEmployeeStatus,
  getEmployeeAdvanceBookingTime,
};
