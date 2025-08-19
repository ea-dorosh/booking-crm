import express from 'express';
import { formatName, formatPhone } from '@/utils/formatters.js';
import { validateEmployeeData } from '@/validators/employeesValidators.js';
import { upload } from '@/utils/uploadFile.js';
import { getEmployees, updateEmployeeStatus } from '@/services/employees/employeesService.js';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import {
  Date_ISO_Type,
  SortDirection,
  AppointmentSortField,
} from '@/@types/utilTypes.js';
import { ResultSetHeader } from 'mysql2';
import { SavedAppointmentItemDataType } from '@/@types/appointmentsTypes.js';
import { getEmployeeAvailability } from '@/services/employees/employeesService.js';
import {
  DEFAULT_APPOINTMENT_SORT_FIELD,
  DEFAULT_SORT_DIRECTION,
} from '@/enums/enums.js';
import { getAppointments } from '@/services/appointment/appointmentService.js';

const router = express.Router();

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });

    return;
  }

  try {
    // support query param status similar to services - can handle multiple statuses via comma
    let statuses: string[] | undefined = undefined;
    const { status } = req.query as { status?: string | string[] };
    if (Array.isArray(status)) {
      statuses = status.flatMap(s => s.split(`,`)).map(s => s.trim());
    } else if (typeof status === `string`) {
      statuses = status.split(`,`).map(s => s.trim());
    }

    const employees = await getEmployees(req.dbPool, statuses);

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
    employeeId,
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

  const values = [availability].map(({
    employeeId, dayId, startTime, endTime,
  }) => [
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

  const employeeId = Number(request.params.id);
  const startDate = ((request.query?.startDate as string) || new Date().toISOString().split(`T`)[0]) as Date_ISO_Type;
  const endDate = (request.query?.endDate as string | null) as Date_ISO_Type | null;

  let status: number | null = null;
  if (request.query?.status !== undefined) {
    status = request.query.status === `null` ? null : Number(request.query.status);
  }

  const sortBy = (request.query?.sortBy as AppointmentSortField) || DEFAULT_APPOINTMENT_SORT_FIELD;
  const sortOrder = (request.query?.sortOrder as SortDirection) || DEFAULT_SORT_DIRECTION;

  try {
    const appointmentsData = await getAppointments(request.dbPool, {
      startDate,
      endDate,
      status,
      employeeId,
      sortBy,
      sortOrder,
    });

    const savedAppointments: SavedAppointmentItemDataType[] = appointmentsData.map((appointment) => ({
      id: appointment.id,
      date: appointment.date,
      timeStart: appointment.timeStart,
      timeEnd: appointment.timeEnd,
      createdDate: appointment.createdDate,
      service: {
        id: 0, // Service ID not available in AppointmentDataType, would need DB join
        name: appointment.serviceName,
        duration: appointment.serviceDuration,
      },
      employee: {
        id: appointment.employee.id,
        firstName: appointment.employee.firstName || ``,
        lastName: appointment.employee.lastName || ``,
      },
      customer: {
        id: appointment.customer.id,
        firstName: appointment.customer.firstName,
        lastName: appointment.customer.lastName,
      },
      status: appointment.status,
      location: ``, // Location not available in AppointmentDataType
    }));

    response.json(savedAppointments);
  } catch (error) {
    response.status(500).json({
      errorMessage: `Error fetching Employee Appointments`,
      message: (error as Error).message,
    });
  }
});

router.put(`/:employeeId/status`, async (request: CustomRequestType, response: CustomResponseType) => {
  const employeeId = Number(request.params.employeeId);
  const { status } = request.body;

  if (!request.dbPool) {
    return response.status(500).json({ message: `Database connection not initialized` });
  }

  if (!status) {
    return response.status(400).json({
      errorMessage: `Status is required`,
      validationErrors: { status: `Status field is required` },
    });
  }

  try {
    const result = await updateEmployeeStatus(request.dbPool, employeeId, status);

    if (result.validationErrors) {
      return response.status(400).json({
        errorMessage: `Validation error`,
        validationErrors: result.validationErrors,
      });
    }

    response.json({
      message: `Employee status updated successfully`,
      employeeId: result.employeeId,
    });
  } catch (error) {
    console.error(`Error updating employee status:`, error);
    response.status(500).json({
      errorMessage: `Error updating employee status`,
      message: (error as Error).message,
    });
  }
});

export default router;
