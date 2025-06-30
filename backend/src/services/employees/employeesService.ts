import { Pool, RowDataPacket } from 'mysql2/promise';
import {
  EmployeeDetailRowType,
  EmployeeDetailDataType,
} from '@/@types/employeesTypes.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';

interface CheckEmployeeParams {
  date: string;
  employeeId: number;
  timeStart: string;
  timeEnd: string;
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

function toMySQLDateTime(isoString: string): string {
  return dayjs(isoString).format('YYYY-MM-DD HH:mm:ss');
}

async function getEmployees(dbPool: Pool): Promise<EmployeeDetailDataType[]> {
  const sql = `
    SELECT
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      image
    FROM Employees
  `;

  const [results] = await dbPool.query<EmployeeDetailRowType[]>(sql);

  const employees: EmployeeDetailDataType[] = results.map((row) => ({
    employeeId: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    image: row.image
      ? `${process.env.SERVER_API_URL}/images/${row.image}`
      : `${process.env.SERVER_API_URL}/images/no-user-photo.png`,
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
  }));

  return employeeData[0];
}

async function checkEmployeeTimeNotOverlap(dbPool: Pool, { date, employeeId, timeStart, timeEnd }: CheckEmployeeParams): Promise<CheckEmployeeAvailabilityResult> {
  const mysqlTimeStart = toMySQLDateTime(timeStart);
  const mysqlTimeEnd   = toMySQLDateTime(timeEnd);

  const checkAvailabilityQuery = `
    SELECT * FROM SavedAppointments
    WHERE employee_id = ?
      AND date = ?
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
    mysqlTimeStart,
    mysqlTimeEnd,
    mysqlTimeStart,
    mysqlTimeEnd,
    mysqlTimeStart,
    mysqlTimeEnd,
  ];

  const [existingAppointments] = await dbPool.query<SavedAppointmentRow[]>(checkAvailabilityQuery, checkAvailabilityValues);

  if (existingAppointments.length > 0) {
    return { isEmployeeAvailable: false };
  } else {
    return { isEmployeeAvailable: true };
  }
}

export {
  getEmployees,
  getEmployee,
  checkEmployeeTimeNotOverlap,
};
