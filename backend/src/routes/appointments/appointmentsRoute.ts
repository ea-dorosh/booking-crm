import express from 'express';
import {
  AppointmentStatusEnum,
  CustomerNewStatusEnum,
} from '@/enums/enums.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes';
import { deleteGoogleCalendarEvent } from '@/services/googleCalendar/googleCalendarService.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { getAppointments, getAppointment } from '@/services/appointment/appointmentService.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';

const router = express.Router();

router.get(`/`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const startDate = request.query?.startDate as Date_ISO_Type | null;
  const status = Number(request.query?.status) as AppointmentStatusEnum | null;

  if (!startDate) {
    response.status(400).json({ error: `startDate query parameter is required` });
    return;
  }

  try {
    const appointmentsData = await getAppointments(request.dbPool, startDate, status);

    response.json(appointmentsData);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error fetching appointments` });
  }
});

router.get(`/:id`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentId = Number(request.params.id);

  if (!appointmentId) {
    response.status(400).json({ error: `appointmentId is required` });
    return;
  }

  try {
    const appointment = await getAppointment(request.dbPool, appointmentId);

    response.json(appointment);
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

  const appointmentId = Number(request.params?.id);

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
    const appointment = await getAppointment(request.dbPool, appointmentId);

    if (!appointment) {
      response.status(404).json({ error: `Appointment not found` });
      return;
    }

    const updateQuery = `
      UPDATE SavedAppointments
      SET status = ?
      WHERE id = ?
    `;

    await request.dbPool.query(updateQuery, [AppointmentStatusEnum.Canceled, appointmentId]);

    if (appointment.googleCalendarEventId) {
      try {
        await deleteGoogleCalendarEvent(request.dbPool, appointment.employee.id, appointment.googleCalendarEventId);
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

  const appointmentId = Number(request.params?.id);
  const appointmentData = request.body;

  try {
    const appointment = await getAppointment(request.dbPool, appointmentId);

    if (!appointment) {
      response.status(404).json({ error: `Appointment not found` });
      return;
    }

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

    if (appointment.googleCalendarEventId) {
      try {
        if (appointment.employee.id !== appointmentData.employeeId) {
          const { deleteGoogleCalendarEvent, createGoogleCalendarEvent } = await import('@/services/googleCalendar/googleCalendarService.js');

          await deleteGoogleCalendarEvent(request.dbPool, appointment.employee.id, appointment.googleCalendarEventId);

          const newGoogleEventId = await createGoogleCalendarEvent(
            request.dbPool,
            appointmentData.employeeId,
            {
              id: Number(appointmentId),
              customerId: appointment.customer.id,
              customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
              serviceName: appointment.serviceName,
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
            appointment.employee.id,
            appointment.googleCalendarEventId,
            {
              id: Number(appointmentId),
              customerId: appointment.customer.id,
              customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
              serviceName: appointment.serviceName,
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
