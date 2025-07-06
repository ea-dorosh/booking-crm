import { Pool } from 'mysql2/promise';
import {
  AppointmentRowType,
  AppointmentDataType,
  AppointmentDetailsRowType,
  AppointmentDetailType,
 } from '@/@types/appointmentsTypes.js';
 import {
  AppointmentStatusEnum,
  CustomerNewStatusEnum,
} from '@/enums/enums.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getEmployee } from '@/services/employees/employeesService.js';
import { fromMySQLToISOString } from '@/utils/timeUtils.js';

async function getAppointments(
  dbPool: Pool,
  startDate: Date_ISO_Type,
  status: AppointmentStatusEnum | null
): Promise<AppointmentDataType[]> {
  const sql = `
    SELECT *
    FROM SavedAppointments
    WHERE
      date >= ?
      AND (status = COALESCE(?, status))
  `;

  const [appointmentsResults] = await await dbPool.query<AppointmentRowType[]>(sql, [startDate, status]);

  console.log(`appointmentsResults[0]: `, appointmentsResults[0]);

  const appointmentsData: AppointmentDataType[] = appointmentsResults.map((row) => {
    return {
      id: row.id,
      date: fromMySQLToISOString(row.date),
      timeStart: fromMySQLToISOString(row.time_start),
      timeEnd: fromMySQLToISOString(row.time_end),
      createdDate: fromMySQLToISOString(row.created_date),
      serviceName: row.service_name,
      serviceDuration: row.service_duration,
      customerLastName: row.customer_last_name,
      customerFirstName: row.customer_first_name,
      status: row.status,
      customer: {
        id: row.customer_id,
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        isCustomerNew: row.is_customer_new === CustomerNewStatusEnum.Existing ? false : true,
      },
      employee: {
        id: row.employee_id,
      },
    };
  });

  return appointmentsData;
}

async function getAppointment(dbPool: Pool, appointmentId: number): Promise<AppointmentDetailType> {
  const sql = `
    SELECT *
    FROM SavedAppointments
    WHERE id = ?
  `;

  const [results] = await dbPool.query<AppointmentDetailsRowType[]>(sql, [appointmentId]);

  const appointment: AppointmentDetailType[] = results.map((row) => {
    return {
      id: row.id,
      date: fromMySQLToISOString(row.date),
      timeStart: fromMySQLToISOString(row.time_start),
      timeEnd: fromMySQLToISOString(row.time_end),
      serviceDuration: row.service_duration,
      serviceId: row.service_id,
      serviceName: row.service_name,
      createdDate: fromMySQLToISOString(row.created_date),
      employee: {
        id: row.employee_id,
        firstName: ``,
        lastName: ``,
      },
      customer: {
        id: row.customer_id,
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        isCustomerNew: row.is_customer_new === CustomerNewStatusEnum.Existing ? false : true,
      },
      status: row.status,
      googleCalendarEventId: row.google_calendar_event_id,
    };
  });

  const employee = await getEmployee(dbPool, appointment[0].employee.id);

  appointment[0].employee = {
    ...appointment[0].employee,
    firstName: employee.firstName,
    lastName: employee.lastName,
  };

  return appointment[0];
}

async function getAppointmentsForCalendar(
  dbPool: Pool,
  dates: Date_ISO_Type[],
  employeeIds: number[],
  status: AppointmentStatusEnum
): Promise<AppointmentDataType[]> {
  const savedAppointmentsQuery = `
    SELECT * FROM SavedAppointments
    WHERE date IN (${dates.map(() => '?').join(',')})
    AND employee_id IN (${employeeIds.map(() => '?').join(',')})
    AND status = ?
  `;

  const [appointmentResults] = await dbPool.query<AppointmentRowType[]>(savedAppointmentsQuery, [
    ...dates,
    ...employeeIds,
    status
  ]);

  const appointmentsData: AppointmentDataType[] = appointmentResults.map((row) => {
    return {
      id: row.id,
      date: fromMySQLToISOString(row.date),
      createdDate: fromMySQLToISOString(row.created_date),
      serviceName: row.service_name,
      timeStart: fromMySQLToISOString(row.time_start),
      timeEnd: fromMySQLToISOString(row.time_end),
      serviceDuration: row.service_duration,
      customerLastName: row.customer_last_name,
      customerFirstName: row.customer_first_name,
      status: row.status,
      customer: {
        id: row.customer_id,
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        isCustomerNew: row.is_customer_new === CustomerNewStatusEnum.Existing ? false : true,
      },
      employee: {
        id: row.employee_id,
      },
    };
  });

  return appointmentsData;
}

export {
  getAppointments,
  getAppointment,
  getAppointmentsForCalendar,
};
