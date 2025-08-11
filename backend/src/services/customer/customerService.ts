import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { validateCustomerData } from '@/validators/customersValidators.js';
import { formatName, formatPhone } from '@/utils/formatters.js';
import {
  CustomerResponseData,
  CustomerRequestRow,
  CustomerFormDataValidationErrors,
} from '@/@types/customersTypes.js';
import { DbPoolType } from '@/@types/expressTypes.js';
import { SalutationEnum } from '@/enums/enums.js';

interface GetCustomersResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addedDate: string;
  lastActivityDate: string;
  address: string;
}

interface GetCustomerResponse {
  id: number;
  salutation: SalutationEnum;
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  addedDate: string;
  addressStreet: string;
  addressZip: string;
  addressCity: string;
  addressCountry: string;
}

export interface CreateCustomerResult {
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
    SELECT customer_id, first_name, last_name, salutation, email, phone, added_date, last_activity_date, address_street, address_zip, address_city, address_country
    FROM Customers
  `;

  const [results] = await dbPool.query<CustomerRequestRow[]>(sql);

  const customersResponse = results.map((row) => {
    let address = ``;
    if (row.address_street) {
      address += `${row.address_street}, `;
    }
    if (row.address_zip) {
      address += `${row.address_zip} `;
    }
    if (row.address_city) {
      address += `${row.address_city}, `;
    }
    if (row.address_country) {
      address += `${row.address_country}`;
    }
    return {
      id: row.customer_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      addedDate: row.added_date,
      lastActivityDate: row.last_activity_date,
      address,
    }});

  return customersResponse;
}

async function getCustomerById(dbPool: DbPoolType, customerId: string): Promise<GetCustomerResponse | null> {
  const sql = `
    SELECT
      customer_id,
      last_name,
      first_name,
      salutation,
      email,
      phone,
      added_date,
      address_street,
      address_city,
      address_zip,
      address_country
    FROM Customers
    WHERE customer_id = ?
  `;

  const [results] = await dbPool.query<CustomerRequestRow[]>(sql, [customerId]);

  const customersResponse = results.map((row) => ({
    id: row.customer_id,
    salutation: row.salutation,
    lastName: row.last_name,
    firstName: row.first_name,
    email: row.email,
    phone: row.phone,
    addedDate: row.added_date,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressZip: row.address_zip,
    addressCountry: row.address_country,
  }));

  return customersResponse.length > 0 ? customersResponse[0] : null;
}

async function createCustomer(dbPool: DbPoolType, customerData: CustomerResponseData): Promise<CreateCustomerResult> {
  const errors = validateCustomerData({
    formData: customerData,
    publicErrors: false,
  });

  if (Object.keys(errors).length > 0) {
    return {
      newCustomerId: null,
      validationErrors: errors,
    };
  }

  const checkCustomerResult = await checkCustomerExists(dbPool, {
    email: customerData.email || ``,
    customerId: null,
  });

  if (checkCustomerResult.exists) {
    return {
      newCustomerId: null,
      validationErrors: {
        email: `Customer with this email already exists`,
      },
    };
  }

  const customerQuery = `
    INSERT INTO Customers (salutation, first_name, last_name, email, phone, address_street, address_zip, address_city, address_country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const customerValues = [
    customerData.salutation,
    formatName(customerData.firstName || ``),
    formatName(customerData.lastName || ``),
    customerData.email,
    formatPhone(customerData.phone || ``),
    customerData.addressStreet || ``,
    customerData.addressZip || ``,
    customerData.addressCity || ``,
    customerData.addressCountry || ``,
  ];

  const [customerResults] = await dbPool.query<ResultSetHeader>(customerQuery, customerValues);

  return {
    newCustomerId: customerResults.insertId,
    validationErrors: null,
  };
}

async function updateCustomerData(dbPool: DbPoolType, customerData: CustomerResponseData, customerId: number): Promise<UpdateCustomerResult> {
  const errors = validateCustomerData({
    formData: customerData,
    publicErrors: false,
  });

  if (Object.keys(errors).length > 0) {
    return {
      updatedCustomerId: null,
      validationErrors: errors,
    };
  }

  const checkCustomerResult = await checkCustomerExists(dbPool, {
    email: customerData.email || ``,
    customerId,
  });

  if (checkCustomerResult.exists) {
    return {
      updatedCustomerId: null,
      validationErrors: {
        email: `You cannot use this email, because it already exists`,
      },
    };
  }

  const sql = `
    UPDATE Customers
    SET last_name = ?, first_name = ?, email = ?, phone = ?, salutation = ?, address_street = ?, address_zip = ?, address_city = ?, address_country = ?
    WHERE customer_id = ?;
  `;


  // TODO: Fix the problem when customer provides updated email, and this email already exists in the database for another customer

  const values = [
    formatName(customerData.lastName || ``),
    formatName(customerData.firstName || ``),
    customerData.email,
    formatPhone(customerData.phone || ``),
    customerData.salutation,
    customerData.addressStreet || ``,
    customerData.addressZip || ``,
    customerData.addressCity || ``,
    customerData.addressCountry || ``,
    customerId,
  ];

  await dbPool.query(sql, values);

  return {
    updatedCustomerId: customerId,
    validationErrors: null,
  };
}

interface CheckCustomerExistsParams {
  email: string;
  customerId: number | null;
}

async function checkCustomerExists(dbPool: DbPoolType, params: CheckCustomerExistsParams): Promise<CheckCustomerExistsResult> {
  const customerCheckQuery = `SELECT customer_id FROM Customers WHERE email = ?`;

  const [customerResults] = await dbPool.query<RowDataPacket[]>(customerCheckQuery, [params.email]);

  if (customerResults.length >= 1) {
    const row = customerResults[0] as { customer_id: number };

    if (params.customerId && row.customer_id === params.customerId) {
      return {
        exists: false, customerId: null, 
      };
    }

    return {
      exists: true, customerId: row.customer_id, 
    };
  } else {
    return {
      exists: false, customerId: null, 
    };
  }
}

export {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomerData,
  checkCustomerExists,
};
