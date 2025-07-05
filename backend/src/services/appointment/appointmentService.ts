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
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getEmployee } from '@/services/employees/employeesService.js';


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
    const appointmentDate = dayjs(row.date).format();
    const timeStart = dayjs(row.time_start).format();
    const createdDate = dayjs(row.created_date).format();

    return {
      id: row.id,
      date: appointmentDate,
      createdDate: createdDate,
      serviceName: row.service_name,
      timeStart: timeStart,
      serviceDuration: row.service_duration,
      customerLastName: row.customer_last_name,
      customerFirstName: row.customer_first_name,
      status: row.status,
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
    const appointmentDate = dayjs(row.date).format();
    const timeStart = dayjs(row.time_start).format();
    const timeEnd = dayjs(row.time_end).format();
    const createdDate = dayjs(row.created_date).format();

    return {
      id: row.id,
      date: appointmentDate,
      timeStart: timeStart,
      timeEnd: timeEnd,
      serviceDuration: row.service_duration,
      serviceId: row.service_id,
      serviceName: row.service_name,
      createdDate: createdDate,
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

export {
  getAppointments,
  getAppointment,
};
