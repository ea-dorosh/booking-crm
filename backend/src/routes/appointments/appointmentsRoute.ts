import express from 'express';
import { AppointmentStatusEnum } from '@/enums/enums.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import {
  getAppointments,
  getAppointment,
  cancelAppointment,
 } from '@/services/appointment/appointmentService.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';


const router = express.Router();

router.get(`/`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const startDate = request.query?.startDate as Date_ISO_Type | null;
  const status = Number(request.query?.status) as AppointmentStatusEnum | null || null;

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

  try {
    const appointment = await getAppointment(request.dbPool, appointmentId);

    if (!appointment) {
      response.status(404).json({ error: `Appointment not found` });
      return;
    }

    try {
      await cancelAppointment(request.dbPool, appointment);
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: `Error canceling appointment` });
      return;
    }

    response.json({ message: `Appointment status updated successfully` });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error updating appointment status` });
  }
});


// TODO: add logic to FE to edit appointment and extract logic to service
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
            {
              employeeId: appointmentData.employeeId,
              id: Number(appointmentId),
              customerId: appointment.customer.id,
              customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
              serviceName: appointment.serviceName,
              timeStart: appointmentData.timeStart,
              timeEnd: appointmentData.timeEnd,
              location: appointment.location,
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

export default router;
