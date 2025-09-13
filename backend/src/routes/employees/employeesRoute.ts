import express from 'express';
import { formatName, formatPhone } from '@/utils/formatters.js';
import { validateEmployeeData } from '@/validators/employeesValidators.js';
import { upload } from '@/utils/uploadFile.js';
import { getEmployees, updateEmployeeStatus } from '@/services/employees/employeesService.js';
import {
  createEmployeePeriod,
  updatePeriodDates,
  getEmployeeActivePeriod,
  getEmployeePeriods,
  getPeriodScheduleRows,
  getEmployeeWorkingTimes,
  upsertEmployeePeriodDay,
  updatePeriodRepeatCycle,
  deleteEmployeePeriodDay,
  deleteEmployeePeriod,
} from '@/services/employees/employeesScheduleService.js';
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
import {
  DEFAULT_APPOINTMENT_SORT_FIELD,
  DEFAULT_SORT_DIRECTION,
} from '@/enums/enums.js';
import { getAppointments } from '@/services/appointment/appointmentService.js';
import { getEmployeesWorkingTimesRange } from '@/services/employees/employeesSchedulePlannerService.js';

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

// Working times for a date range (planning calendar)
router.get(`/working-times-range`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const {
    startDate,
    endDate,
    employeeIds,
  } = req.query as {
    startDate?: string;
    endDate?: string;
    employeeIds?: string;
  };

  if (!startDate || !endDate) {
    res.status(400).json({ message: `startDate and endDate are required (YYYY-MM-DD)` });
    return;
  }

  try {
    // Resolve employee ids: provided or all active
    let employeeIdList: number[] = [];
    if (employeeIds) {
      employeeIdList = String(employeeIds)
        .split(`,`)
        .map(value => Number(value))
        .filter(num => Number.isFinite(num));
    } else {
      const activeEmployees = await getEmployees(req.dbPool, [ `active` ]);
      employeeIdList = activeEmployees.map(e => e.employeeId);
    }

    const days = await getEmployeesWorkingTimesRange(
      req.dbPool,
      employeeIdList,
      startDate as any,
      endDate as any,
    );

    res.json(days);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Failed to load working times` });
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


// --- New schedule periods API ---
router.post(`/:employeeId/schedule-periods`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const employeeId = Number(req.params.employeeId);
  const {
    validFrom, validUntil, repeatCycle,
  } = req.body;

  try {
    const periodId = await createEmployeePeriod(req.dbPool, employeeId, {
      validFrom,
      validUntil,
      repeatCycle,
    });
    res.json({ id: periodId });
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.put(`/schedule-periods/:periodId/dates`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const periodId = Number(req.params.periodId);
  const {
    validFrom, validUntil,
  } = req.body;

  try {
    await updatePeriodDates(req.dbPool, periodId, {
      validFrom, validUntil,
    });
    res.json({ message: `Period dates updated` });
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.get(`/:employeeId/schedule-periods/active`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const employeeId = Number(req.params.employeeId);
  const date = String(req.query.date);

  try {
    const period = await getEmployeeActivePeriod(req.dbPool, employeeId, date as any);
    res.json(period);
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.get(`/:employeeId/schedule-periods`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const employeeId = Number(req.params.employeeId);

  try {
    const periods = await getEmployeePeriods(req.dbPool, employeeId);
    res.json(periods);
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.get(`/schedule-periods/:periodId/schedule`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const periodId = Number(req.params.periodId);

  try {
    const rows = await getPeriodScheduleRows(req.dbPool, periodId);
    res.json(rows);
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.put(`/schedule-periods/:periodId/repeat-cycle`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const periodId = Number(req.params.periodId);
  const { repeatCycle } = req.body as { repeatCycle: 1 | 2 | 3 | 4 };

  try {
    await updatePeriodRepeatCycle(req.dbPool, periodId, repeatCycle);
    res.json({ message: `Repeat cycle updated` });
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.get(`/:employeeId/working-times`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const employeeId = Number(req.params.employeeId);
  const date = String(req.query.date);

  try {
    const result = await getEmployeeWorkingTimes(req.dbPool, employeeId, date as any);
    res.json(result);
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.post(`/schedule-periods/:periodId/week/:weekNumber/day/:dayId`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const periodId = Number(req.params.periodId);
  const weekNumber = Number(req.params.weekNumber);
  const dayId = Number(req.params.dayId);
  const {
    startTime, endTime, blockStartTimeFirst, blockEndTimeFirst,
  } = req.body;

  try {
    await upsertEmployeePeriodDay(
      req.dbPool,
      periodId,
      weekNumber,
      dayId,
      startTime,
      endTime,
      blockStartTimeFirst,
      blockEndTimeFirst,
    );
    res.json({ message: `Day schedule upserted` });
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.delete(`/schedule-periods/:periodId/week/:weekNumber/day/:dayId`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const periodId = Number(req.params.periodId);
  const weekNumber = Number(req.params.weekNumber);
  const dayId = Number(req.params.dayId);

  try {
    await deleteEmployeePeriodDay(req.dbPool, periodId, weekNumber, dayId);
    res.json({ message: `Day schedule deleted` });
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
  }
});

router.delete(`/schedule-periods/:periodId`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }


  const periodId = Number(req.params.periodId);

  try {
    await deleteEmployeePeriod(req.dbPool, periodId);
    res.json({ message: `Schedule period deleted` });
  } catch (error) {
    const status = (error as any).statusCode || 500;
    res.status(status).json({ message: (error as Error).message });
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
