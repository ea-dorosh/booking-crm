import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { validateCustomerData } from '@/validators/customersValidators';
import { formatName, formatPhone } from '@/utils/formatters';
import { 
  CustomerDataType,
  CustomerRowType,
  CustomerFormDataValidationErrors,
} from '@/@types/customersTypes';
import {DbPoolType} from '@/@types/expressTypes';

interface GetCustomersResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addedDate: string;
}

interface CreateCustomerResult {
  newCustomerId: number | null;
  validationErrors: CustomerFormDataValidationErrors | null;
}

interface UpdateCustomerResult {
  updatedCustomerId: number | null;
  validationErrors: CustomerFormDataValidationErrors | null;
}

export interface CheckCustomerExistsResult {
  exists: boolean;
  customerId: number | null;
}

async function getCustomers(dbPool: DbPoolType): Promise<GetCustomersResponse[]> {
  const sql = `
    SELECT customer_id, first_name, last_name, salutation, email, phone, added_date
    FROM Customers
  `;

  const [results] = await dbPool.query<CustomerRowType[]>(sql);

  const customersResponse = results.map((row) => ({
    id: row.customer_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    addedDate: row.added_date,
  }));

  return customersResponse;
}

async function createCustomer(dbPool: DbPoolType, customerData: CustomerDataType): Promise<CreateCustomerResult> {
  const errors = validateCustomerData(customerData);

  if (Object.keys(errors).length > 0) {
    return { 
      newCustomerId: null,
      validationErrors: errors,
    };
  }

  const customerQuery = `
    INSERT INTO Customers (salutation, first_name, last_name, email, phone)
    VALUES (?, ?, ?, ?, ?)
  `;

  const customerValues = [
    customerData.salutation,
    formatName(customerData.firstName),
    formatName(customerData.lastName),
    customerData.email,
    formatPhone(customerData.phone),
  ];

  const [customerResults] = await dbPool.query<ResultSetHeader>(customerQuery, customerValues);

  return { 
    newCustomerId: customerResults.insertId,
    validationErrors: null,
  };
}

async function updateCustomerData(dbPool: DbPoolType, customerData: CustomerDataType, customerId: number): Promise<UpdateCustomerResult> {
  const errors = validateCustomerData(customerData);

  if (Object.keys(errors).length > 0) {
    return {
      updatedCustomerId: null,
      validationErrors: errors,
    };
  }

  const sql = `
    UPDATE Customers
    SET last_name = ?, first_name = ?, email = ?, phone = ?, salutation = ?
    WHERE customer_id = ?;
  `;

  const values = [
    formatName(customerData.lastName),
    formatName(customerData.firstName),
    customerData.email,
    formatPhone(customerData.phone),
    customerData.salutation,
    customerId,
  ];

  await dbPool.query(sql, values);

  return { 
    updatedCustomerId: customerId,
    validationErrors: null,
  };
}

async function checkCustomerExists(dbPool: DbPoolType, email: string): Promise<CheckCustomerExistsResult> {
  const customerCheckQuery = `SELECT customer_id FROM Customers WHERE email = ?`;

  const [customerResults] = await dbPool.query<RowDataPacket[]>(customerCheckQuery, [email]);
  
  if (customerResults.length >= 1) {
    const row = customerResults[0] as { customer_id: number };
    return { exists: true, customerId: row.customer_id };
  } else {
    return { exists: false, customerId: null };
  }
}

export {  
  getCustomers, 
  createCustomer, 
  updateCustomerData, 
  checkCustomerExists 
};
