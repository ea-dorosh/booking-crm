import express from 'express';
import { getCustomers, createCustomer, updateCustomerData } from '@/services/customer/customerService';
import { getEmployees } from '@/services/employees/employeesService';
import { 
  CustomRequestType, 
  CustomResponseType,
} from '@/@types/expressTypes';
import { CustomerRowType } from '@/@types/customersTypes';
import { RowDataPacket } from 'mysql2';
import { SavedAppointmentItemDataType } from '@/@types/appointmentsTypes';

const router = express.Router();

router.get(`/`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  try {
    const customers = await getCustomers(request.dbPool);

    response.json(customers);

    return;
  } catch (error) {
    response.status(500).json({
      errorMessages: `Error fetching customers`,
      error: (error as Error).message,
    });

    return;
  }
});

router.get(`/:id`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  const customerId = request.params.id;

  const sql = `
    SELECT 
      customer_id, 
      last_name, 
      first_name,
      salutation, 
      email,
      phone,
      added_date
    FROM Customers
    WHERE customer_id = ?
  `;

  try {
    const [results] = await request.dbPool.query<CustomerRowType[]>(sql, [customerId]);

    const customersResponse = results.map((row) => ({
      id: row.customer_id,
      salutation: row.salutation, 
      lastName: row.last_name,
      firstName: row.first_name, 
      email: row.email,
      phone: row.phone,
      addedDate: row.added_date,
    }));

    response.json(customersResponse[0]);

    return;
  } catch (error) {
    response.status(500).json({ 
      errorMessage: `Error fetching customer details`,
      message: (error as Error).message,
    });
  }
});

router.post(`/create-customer`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  const customer = request.body;

  try {
    const { newCustomerId, validationErrors } = await createCustomer(request.dbPool, customer);
  
    if (validationErrors) {
      response.status(428).json({ 
          errorMessage: `Validation failed`,
          validationErrors,
        });
    } else if (newCustomerId) {
      response.json({
        message: `Customer data inserted successfully`,
        data: newCustomerId,
    });
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };
      if (mysqlError.code === 'ER_DUP_ENTRY') {
        response.status(409).json({
          errorMessage: `Customer with this email already exists`,
        });

        return;
      }

      response.status(500).json({
        errorMessage: `Error while creating customer`,
        message: mysqlError.message,
      });

      return;
    }

    if (error instanceof Error) {
      response.status(500).json({ 
        errorMessage: `Error while creating customer`,
        message: error.message,
      });

      return;
    }

    response.status(500).json({ 
      errorMessage: `Unknown error occurred`,
    });

    return;
  }
});

router.put(`/edit/:id`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }

  const customerId = Number(request.params.id);
  const customer = request.body;

  try {
    const { updatedCustomerId, validationErrors } = await updateCustomerData(request.dbPool, customer, customerId);

    if (validationErrors) {
      response.status(428).json({ 
          errorMessage: `Validation failed`,
          validationErrors,
        });
    } else if (updatedCustomerId) {
      response.json({
        message: `Customer with id: ${updatedCustomerId} has been updated successfully`,
        data: updatedCustomerId,
      });
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code?: string; message?: string };
      
      if (mysqlError.code === `ER_DUP_ENTRY`) {
        response.status(409).json({
          errorMessage: `Customer with this email already exists`,
        });

        return;
      }

      response.status(500).json({
        errorMessage: `Error while creating customer`,
        message: mysqlError.message,
      });

      return;
    }

    if (error instanceof Error) {
      response.status(500).json({ 
        errorMessage: `Error while creating customer`,
        message: error.message,
      });

      return;
    }

    response.status(500).json({ 
      errorMessage: `Unknown error occurred`,
    });

    return;
  }
});

router.get(`/:id/saved-appointments`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: new Error(`Database connection not initialized`).message,
    });

    return;
  }
  
  const customerId = request.params.id;
  const employees = await getEmployees(request.dbPool);

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
      employee_id,
      status
    FROM SavedAppointments
    WHERE customer_id = ?
  `;

  interface CustomerSavedAppointmentsRowType extends RowDataPacket {
    id: number;
    date: string;
    time_start: string;
    time_end: string;
    service_id: number;
    service_name: string;
    created_date: string;
    service_duration: number;
    employee_id: number;
    status: string;
  }

  try {
    const [results] = await request.dbPool.query<CustomerSavedAppointmentsRowType[]>(sql, [customerId]);

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
        id: row.employee_id,
        firstName: employees.find(employee => employee.employeeId === row.employee_id)?.firstName || ``,
        lastName: employees.find(employee => employee.employeeId === row.employee_id)?.lastName || ``,
      },
      customer: {
        id: Number(customerId),
        firstName: ``,
        lastName: ``,
      },
      status: row.status,
    }));

    response.json(savedAppointments);

    return;
  } catch (error) {
    response.status(500).json({ 
      errorMessage: `Error fetching Saved Appointments`,
      message: (error as Error).message,
    });

    return;
  }
});

export default router;
