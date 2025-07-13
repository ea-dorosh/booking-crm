import express from 'express';
import { formatName, formatPhone } from '@/utils/formatters.js';
import { validateEmployeeData } from '@/validators/employeesValidators.js';
import { upload } from '@/utils/uploadFile.js';
import { getEmployees } from '@/services/employees/employeesService.js';
import { getCustomers } from '@/services/customer/customerService.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { SavedAppointmentItemDataType } from '@/@types/appointmentsTypes.js';
import { getEmployeeAvailability } from '@/services/employees/employeesService.js';

const router = express.Router();

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    const employees = await getEmployees(req.dbPool);

    res.json(employees);

    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching employees` });

    return;
  }
});

router.post(`/create-employee`, upload.single(`image`), async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const employee = req.body;
  const imgPath = req.file?.filename || null;

  // Validation
  const errors = validateEmployeeData(employee);

  if (Object.keys(errors).length > 0) {
    res.status(428).json({ errors });

    return;
  }

  const query = `
    INSERT INTO Employees (first_name, last_name, email, phone, image)
    VALUES (?, ?, ?, ?, COALESCE(?, image))
  `;

  const values = [
    formatName(employee.firstName),
    formatName(employee.lastName),
    employee.email,
    formatPhone(employee.phone),
    imgPath,
  ];

  let employeeId;

  try {
    const [employeeResults] = await req.dbPool.query<ResultSetHeader>(query, values);
    employeeId = employeeResults.insertId;

    res.json({
        message: `New employee data inserted successfully`,
        data: employeeId,
    });
  } catch (error) {
    res.status(500).json(error);

    return;
  }
});

router.put(`/edit/:id`, upload.single(`image`), async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const employeeId = req.params.id;
  const employee = req.body;

  const imgPath = req.file?.filename || null;

  // Validation
  const errors = validateEmployeeData(employee);

  if (Object.keys(errors).length > 0) {
    res.status(428).json({ errors });

    return;
  }

  const query = `UPDATE Employees
    SET first_name = ?, last_name = ?, email = ?, phone = ?, image = COALESCE(?, image)
    WHERE employee_id = ?
  `;

  const values = [
    formatName(employee.firstName),
    formatName(employee.lastName),
    employee.email,
    formatPhone(employee.phone),
    imgPath,
    employeeId
  ];

  try {
    const [employeeResults] = await req.dbPool.query<ResultSetHeader>(query, values);

    res.json({
      message: `Employee data updated successfully`,
      data: employeeResults.insertId,
    });

    return;
  } catch (error) {
    res.status(500).json(error);

    return;
  }
});

router.get(`/:employeeId/availabilities`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const employeeId = req.params.employeeId;

  try {
    const employeeAvailability = await getEmployeeAvailability(req.dbPool, [Number(employeeId)]);

    res.json(employeeAvailability);

    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching EmployeeAvailability` });

    return;
  }
});

router.post(`/availability`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const availability = req.body;

  const upsertQuery = `
  INSERT INTO EmployeeAvailability (employee_id, day_id, start_time, end_time)
  VALUES ?
  ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)
`;

  const values = [availability].map(({ employeeId, dayId, startTime, endTime }) => [
    employeeId,
    dayId,
    startTime,
    endTime,
  ]);

  try {
    const [result] = await req.dbPool.query<ResultSetHeader>(upsertQuery, [values]);

    res.json({
      message: `Availability data inserted successfully`,
      data: result,
    });

    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error updating EmployeeAvailability` });
    return;
  }
});

router.delete(`/:id/availability`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const availabilityId = req.params.id;

  const deleteQuery = `DELETE FROM EmployeeAvailability WHERE id = ?`;

  try {
    const [results] = await req.dbPool.query<ResultSetHeader>(deleteQuery, [availabilityId]);

    if (results.affectedRows === 0) {
      res.status(404).json({ error: `Availability not found` });

      return;
    } else {
      res.status(200).json({ message: `Availability deleted successfully` });

      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error deleting EmployeeAvailability` });

    return;
  }
});

router.get(`/:id/appointments`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  const employeeId = request.params.id;
  const customers = await getCustomers(request.dbPool);

  const sql = `
    SELECT
      id,
      date,
      time_start,
      time_end,
      service_id,
      service_name,
      created_date,
      service_duration,
      customer_id,
      status,
      location
    FROM SavedAppointments
    WHERE employee_id = ?
  `;

  interface EmployeeSavedAppointmentsRowType extends RowDataPacket {
    id: number;
    date: string;
    time_start: string;
    time_end: string;
    service_id: number;
    service_name: string;
    created_date: string;
    service_duration: number;
    customer_id: number;
    status: string;
    location: string;
  }

  try {
    const [results] = await request.dbPool.query<EmployeeSavedAppointmentsRowType[]>(sql, [employeeId]);

    const savedAppointments: SavedAppointmentItemDataType[] = results.map((row) => ({
      id: row.id,
      date: row.date,
      timeStart: row.time_start,
      timeEnd: row.time_end,
      createdDate: row.created_date,
      service: {
        id: row.service_id,
        name: row.service_name,
        duration: row.service_duration,
      },
      employee: {
        id: Number(employeeId),
        firstName: ``,
        lastName: ``,
      },
      customer: {
        id: row.customer_id,
        firstName: customers.find(customer => customer.id === row.customer_id)?.firstName || ``,
        lastName: customers.find(customer => customer.id === row.customer_id)?.lastName || ``,
      },
      status: row.status,
      location: row.location,
    }));

    response.json(savedAppointments);

    return;
  } catch (error) {
    response.status(500).json({
      errorMessage: `Error fetching Saved Appointments`,
      message: (error as Error).message,
    });
  }
});

export default router;
