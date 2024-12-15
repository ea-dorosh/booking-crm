import express from 'express';
import { 
  AppointmentStatusEnum,
  CustomerNewStatusEnum,
} from '@/enums/enums';
import { 
  CustomRequestType, 
  CustomResponseType,
} from '@/@types/expressTypes';
import {
  AppointmentRowType, 
  AppointmentDataType,
  AppointmentDetailsRowType,
  AppointmentDetailType,
 } from '@/@types/appointmentsTypes';
import {
  EmployeeDetailRowType,
} from '@/@types/employeesTypes';

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
    response.status(500).json({ error: 'Error fetching employees' });
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

  const sql = `
    UPDATE SavedAppointments
    SET status = ?
    WHERE id = ?
  `;

  try {
    await request.dbPool.query(sql, [AppointmentStatusEnum.Canceled, appointmentId]);

    response.json({ message: `Appointment status updated successfully` });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: `Error updating appointment status` });
  }
});

// TODO: add route for editing appointments from crm
router.put(`/:id/edit`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const appointmentId = request.params.id;
});


// TODO: add route for creating appointments from crm
router.post(`/create`, async (request: CustomRequestType, response: CustomResponseType) => {
  const appointment = request.body;
});

export default router;
