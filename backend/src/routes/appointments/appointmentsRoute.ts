import express from 'express';
import {
  AppointmentStatusEnum,
  CustomerNewStatusEnum,
} from '@/enums/enums.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes';
import {
  AppointmentRowType,
  AppointmentDataType,
  AppointmentDetailsRowType,
  AppointmentDetailType,
 } from '@/@types/appointmentsTypes.js';
import {
  EmployeeDetailRowType,
} from '@/@types/employeesTypes.js';
import { deleteGoogleCalendarEvent } from '@/services/googleCalendar/googleCalendarService.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dayjs } from '@/services/dayjs/dayjsService.js';

const router = express.Router();

router.get('/', async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const { startDate, status = null } = request.query;

  if (!startDate) {
    response.status(400).json({ error: `startDate query parameter is required` });
    return;
  }

  const appointmentsSql = `
    SELECT
      id,
      date,
      created_date,
      service_name,
      time_start,
      service_duration,
      customer_last_name,
      customer_first_name,
      status
    FROM SavedAppointments
    WHERE
      date >= ?
      AND (status = COALESCE(?, status))
  `;

  const queryParams: (string | null)[] = [String(startDate), status !== null ? String(status) : null];

  try {
    const [appointmentsResults] = await request.dbPool.query<AppointmentRowType[]>(appointmentsSql, queryParams);

    const appointmentsData: AppointmentDataType[] = appointmentsResults.map((row) => ({
      id: row.id,
      date: row.date,
      createdDate: row.created_date,
      serviceName: row.service_name,
      timeStart: row.time_start,
      serviceDuration: row.service_duration,
      customerLastName: row.customer_last_name,
      customerFirstName: row.customer_first_name,
      status: row.status,
    }));

    response.json(appointmentsData);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error fetching employees` });
  }
});

router.get(`/:id`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentId = request.params.id;

  const sql = `
    SELECT
      id,
      employee_id,
      date,
      time_start,
      time_end,
      service_duration,
      service_id,
      service_name,
      customer_id,
      created_date,
      customer_last_name,
      customer_first_name,
      is_customer_new,
      status
    FROM SavedAppointments
    WHERE id = ?
  `;

  try {
    const [results] = await request.dbPool.query<AppointmentDetailsRowType[]>(sql, [appointmentId]);

    const appointment: AppointmentDetailType[] = results.map((row) => ({
      id: row.id,
      date: row.date,
      timeStart: row.time_start,
      timeEnd: row.time_end,
      serviceDuration: row.service_duration,
      serviceId: row.service_id,
      serviceName: row.service_name,
      createdDate: row.created_date,
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
    }));

    const employeeSql = `
      SELECT employee_id, first_name, last_name
      FROM Employees
      WHERE employee_id = ?
    `;

    const [employeeResults] = await request.dbPool.query<EmployeeDetailRowType[]>(employeeSql, [appointment[0].employee.id]);

    appointment[0].employee = {
      ...appointment[0].employee,
      firstName: employeeResults[0].first_name,
      lastName: employeeResults[0].last_name
    };

    response.json(appointment[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error fetching appointment` });
  }
});

router.put(`/:id/cancel`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentId = request.params.id;

  const getAppointmentQuery = `
    SELECT employee_id, google_calendar_event_id
    FROM SavedAppointments
    WHERE id = ?
  `;

  interface AppointmentRow extends RowDataPacket {
    employee_id: number;
    google_calendar_event_id: string | null;
  }

  try {
    const [rows] = await request.dbPool.query<AppointmentRow[]>(getAppointmentQuery, [appointmentId]);

    if (rows.length === 0) {
      response.status(404).json({ error: `Appointment not found` });
      return;
    }

    const { employee_id, google_calendar_event_id } = rows[0];

    const updateQuery = `
      UPDATE SavedAppointments
      SET status = ?
      WHERE id = ?
    `;

    await request.dbPool.query(updateQuery, [AppointmentStatusEnum.Canceled, appointmentId]);

    if (google_calendar_event_id) {
      try {
        await deleteGoogleCalendarEvent(request.dbPool, employee_id, google_calendar_event_id);
      } catch (error) {
        console.error(`Error deleting Google Calendar event:`, error);
      }
    }

    response.json({ message: `Appointment status updated successfully` });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error updating appointment status` });
  }
});

router.put(`/:id/edit`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentId = request.params.id;
  const appointmentData = request.body;

  const getAppointmentQuery = `
    SELECT
      employee_id, service_id, service_name, customer_id,
      customer_first_name, customer_last_name, google_calendar_event_id
    FROM SavedAppointments
    WHERE id = ?
  `;

  interface AppointmentEditRow extends RowDataPacket {
    employee_id: number;
    service_id: number;
    service_name: string;
    customer_id: number;
    customer_first_name: string;
    customer_last_name: string;
    google_calendar_event_id: string | null;
  }

  try {
    const [rows] = await request.dbPool.query<AppointmentEditRow[]>(getAppointmentQuery, [appointmentId]);

    if (rows.length === 0) {
      response.status(404).json({ error: `Appointment not found` });
      return;
    }

    const appointment = rows[0];

    const updateQuery = `
      UPDATE SavedAppointments
      SET
        date = ?,
        time_start = ?,
        time_end = ?,
        employee_id = ?
      WHERE id = ?
    `;

    await request.dbPool.query(updateQuery, [
      appointmentData.date,
      appointmentData.timeStart,
      appointmentData.timeEnd,
      appointmentData.employeeId,
      appointmentId
    ]);

    if (appointment.google_calendar_event_id) {
      try {
        if (appointment.employee_id !== appointmentData.employeeId) {
          const { deleteGoogleCalendarEvent, createGoogleCalendarEvent } = await import('@/services/googleCalendar/googleCalendarService.js');

          await deleteGoogleCalendarEvent(request.dbPool, appointment.employee_id, appointment.google_calendar_event_id);

          const newGoogleEventId = await createGoogleCalendarEvent(
            request.dbPool,
            appointmentData.employeeId,
            {
              id: Number(appointmentId),
              customerId: appointment.customer_id,
              customerName: `${appointment.customer_first_name} ${appointment.customer_last_name}`,
              serviceName: appointment.service_name,
              date: appointmentData.date,
              timeStart: appointmentData.timeStart,
              timeEnd: appointmentData.timeEnd
            }
          );

          if (newGoogleEventId) {
            const updateGoogleEventQuery = `
              UPDATE SavedAppointments
              SET google_calendar_event_id = ?
              WHERE id = ?
            `;
            await request.dbPool.query(updateGoogleEventQuery, [newGoogleEventId, appointmentId]);
          }
        } else {
          const { updateGoogleCalendarEvent } = await import('@/services/googleCalendar/googleCalendarService.js');

          await updateGoogleCalendarEvent(
            request.dbPool,
            appointment.employee_id,
            appointment.google_calendar_event_id,
            {
              id: Number(appointmentId),
              customerId: appointment.customer_id,
              customerName: `${appointment.customer_first_name} ${appointment.customer_last_name}`,
              serviceName: appointment.service_name,
              date: appointmentData.date,
              timeStart: appointmentData.timeStart,
              timeEnd: appointmentData.timeEnd
            }
          );
        }
      } catch (error) {
        console.error(`Error updating Google Calendar event:`, error);
      }
    }

    response.json({ message: `Appointment updated successfully` });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error updating appointment` });
  }
});

router.post(`/create`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentData = request.body;

  try {
    const insertQuery = `
      INSERT INTO SavedAppointments (
        date,
        time_start,
        time_end,
        service_id,
        service_name,
        customer_id,
        service_duration,
        employee_id,
        created_date,
        customer_salutation,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        is_customer_new,
        google_calendar_event_id,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await request.dbPool.query<ResultSetHeader>(insertQuery, [
      appointmentData.date,
      appointmentData.timeStart,
      appointmentData.timeEnd,
      appointmentData.serviceId,
      appointmentData.serviceName,
      appointmentData.customerId,
      appointmentData.serviceDuration,
      appointmentData.employeeId,
      dayjs().format('YYYY-MM-DD HH:mm:ss'),
      appointmentData.customerSalutation,
      appointmentData.customerFirstName,
      appointmentData.customerLastName,
      appointmentData.customerEmail,
      appointmentData.customerPhone,
      appointmentData.isCustomerNew || CustomerNewStatusEnum.Existing,
      null, // google_calendar_event_id
      appointmentData.status || AppointmentStatusEnum.Active
    ]);

    const appointmentId = insertResult.insertId;

    try {
      const { createGoogleCalendarEvent } = await import('@/services/googleCalendar/googleCalendarService.js');

      const googleEventId = await createGoogleCalendarEvent(
        request.dbPool,
        appointmentData.employeeId,
        {
          id: appointmentId,
          customerId: appointmentData.customerId,
          customerName: `${appointmentData.customerFirstName} ${appointmentData.customerLastName}`,
          serviceName: appointmentData.serviceName,
          date: appointmentData.date,
          timeStart: appointmentData.timeStart,
          timeEnd: appointmentData.timeEnd
        }
      );

      if (googleEventId) {
        const updateGoogleEventQuery = `
          UPDATE SavedAppointments
          SET google_calendar_event_id = ?
          WHERE id = ?
        `;
        await request.dbPool.query(updateGoogleEventQuery, [googleEventId, appointmentId]);
      }
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
    }

    response.json({
      message: `Appointment created successfully`,
      id: appointmentId
    });
  } catch (error) {
    console.error(`Error creating appointment:`, error);
    response.status(500).json({ error: `Error creating appointment` });
  }
});

export default router;
