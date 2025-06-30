import { DbPoolType } from '@/@types/expressTypes.js';
import { ResultSetHeader } from 'mysql2';
import {
  InvoiceStatusEnum,
  SalutationEnum,
} from '@/enums/enums.js';
import { getCustomers, createCustomer, CreateCustomerResult, checkCustomerExists } from '@/services/customer/customerService.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import {
  InvoicesRequestRow,
  InvoiceByIdRequestRow,
  InvoiceResponseData,
  InvoiceByIdResponseData,
  InvoiceUpdatedData,
  InvoiceFormDataValidationErrors,
  InvoiceItemsData,
  InvoiceItemsRequestRow,
 } from '@/@types/invoicesTypes.js';
import { validateInvoiceFormData } from '@/validators/invoicesValidators.js';
import { getDueDate, toMySQLDate } from '@/utils/timeUtils.js';
import { parseNumberWithComma } from '@/utils/formatters.js';
import { getCompany } from '@/services/company/companyService.js';
interface CreateInvoiceResult {
  createdInvoiceId: number | null;
  validationErrors: InvoiceFormDataValidationErrors | null;
}

async function getInvoices(dbPool: DbPoolType): Promise<InvoiceResponseData[]> {
  const customers = await getCustomers(dbPool);

  const sql = `
    SELECT *
    FROM Invoices
  `;

  const [result] = await dbPool.query<InvoicesRequestRow[]>(sql);

  const invoices: InvoiceResponseData[] = result.map((row) => ({
    id: row.id,
    customer: {
      id: row.client_id,
      firstName: customers.find(customer => customer.id === row.client_id)?.firstName || ``,
      lastName: customers.find(customer => customer.id === row.client_id)?.lastName || ``,
    },
    invoiceNumber: row.invoice_number,
    dateIssued: dayjs(row.date_issued).format('YYYY-MM-DD'),
    dueDate: dayjs(row.due_date).format('YYYY-MM-DD'),
    status: row.status,
    subtotal: row.subtotal,
    taxes: row.taxes,
    totalAmount: row.total_amount,
    currency: row.currency,
  }));

  return invoices;
}

async function geInvoiceById(dbPool: DbPoolType, invoiceId: string): Promise<InvoiceByIdResponseData | null> {
  const customers = await getCustomers(dbPool);

  const sql = `
    SELECT
      id,
      client_id,
      invoice_number,
      date_issued,
      due_date,
      status,
      subtotal,
      taxes,
      total_amount,
      currency,
      company_name,
      company_address_street,
      company_address_zip,
      company_address_city,
      company_address_country,
      company_phone,
      company_email,
      company_tax_number,
      company_bank_account,
      company_website
    FROM Invoices
    WHERE id = ?
  `;

  const [results] = await dbPool.query<InvoiceByIdRequestRow[]>(sql, [invoiceId]);

  const invoicesResponse = results.map((row) => ({
    id: row.id,
    customer: {
      id: row.client_id,
      firstName: customers.find(customer => customer.id === row.client_id)?.firstName || ``,
      lastName: customers.find(customer => customer.id === row.client_id)?.lastName || ``,
      email: customers.find(customer => customer.id === row.client_id)?.email || ``,
      phone: customers.find(customer => customer.id === row.client_id)?.phone || ``,
      address: customers.find(customer => customer.id === row.client_id)?.address || ``,
    },
    company: {
      name: row.company_name,
      address: `${row.company_address_street}, ${row.company_address_zip} ${row.company_address_city}, ${row.company_address_country}`,
      phone: row.company_phone,
      email: row.company_email,
      taxNumber: row.company_tax_number,
      bankAccount: row.company_bank_account,
      website: row.company_website,
    },
    invoiceNumber: row.invoice_number,
    dateIssued: dayjs(row.date_issued).format(`YYYY-MM-DD`),
    dueDate: dayjs(row.due_date).format(`YYYY-MM-DD`),
    status: row.status,
    subtotal: row.subtotal,
    taxes: row.taxes,
    totalAmount: row.total_amount,
    currency: row.currency,
  }));

  if (invoicesResponse.length > 0) {
    const invoiceItemsSql = `
      SELECT *
      FROM InvoiceItems
      WHERE invoice_id = ?
    `;

    const [invoiceItemsResults] = await dbPool.query<InvoiceItemsRequestRow[]>(invoiceItemsSql, [invoiceId]);

    const invoiceItems = invoiceItemsResults.map((row) => ({
      id: row.id,
      serviceId: row.service_id,
      serviceName: row.service_name,
      serviceQuantity: row.service_quantity,
      servicePrice: row.service_price,
      serviceTaxRate: row.service_tax_rate,
      serviceTaxAmount: row.service_tax_amount,
      serviceTotalAmount: row.service_total_amount,
    }));

    return {
      ...invoicesResponse[0],
      servicesItems: invoiceItems.length > 0 ? invoiceItems : null,
    };
  } else {
    return null;
  }
}

async function createInvoice(dbPool: DbPoolType, invoiceData: InvoiceUpdatedData): Promise<CreateInvoiceResult> {
  if (invoiceData.isNewCustomer && invoiceData.email) {
    const checkCustomerResult = await checkCustomerExists(dbPool, {email: invoiceData.email, customerId: null});

    if (checkCustomerResult.exists) {
      return {
        createdInvoiceId: null,
        validationErrors: {
          email: `Customer with this email already exists`,
        },
      };
    }
  } else if (invoiceData.isNewCustomer && !invoiceData.email) {

    return {
      createdInvoiceId: null,
      validationErrors: {
        email: `Email is required for new customers`,
      },
    };
  }

  const errors = validateInvoiceFormData(invoiceData);

  if (Object.keys(errors).length > 0) {
    return {
      createdInvoiceId: null,
      validationErrors: errors,
    };
  }

  let customerId = invoiceData.customerId;
  let customerResponse: CreateCustomerResult | null = null;

  const companyInfo = await getCompany(dbPool);

  if (invoiceData.isNewCustomer) {
    customerResponse = await createCustomer(dbPool, {
      salutation: invoiceData.salutation ?
        (invoiceData.salutation in SalutationEnum ? invoiceData.salutation : null) :
        null,
      firstName: invoiceData.firstName || ``,
      lastName: invoiceData.lastName || ``,
      email: invoiceData.email || ``,
      phone: invoiceData.phone || ``,
    });

    customerId = customerResponse.newCustomerId;
  }

  const {
    servicePrice,
    servicePriceSum,
    serviceTaxAmountSum,
    serviceTotalAmountSum,
  } = invoiceData.services.reduce((acc, serviceItem) => {
    const {
      serviceQuantity,
      servicePrice,
      serviceTaxAmount,
      serviceTotalAmount,
    } = calculateInvoiceTotals(serviceItem);

    return {
      servicePrice: acc.servicePrice + servicePrice,
      servicePriceSum: acc.servicePriceSum + servicePrice * serviceQuantity,
      serviceTaxAmountSum: acc.serviceTaxAmountSum + serviceTaxAmount,
      serviceTotalAmountSum: acc.serviceTotalAmountSum + serviceTotalAmount,
    };
  }, { servicePrice: 0, servicePriceSum: 0, serviceTaxAmountSum: 0, serviceTotalAmountSum: 0 });

  // find the last existing invoice number in DB
  const sqlLastInvoiceNumber = `
    SELECT invoice_number
    FROM Invoices
    ORDER BY CAST(invoice_number AS UNSIGNED) DESC
    LIMIT 1
  `;

  const [lastInvoiceNumberResult] = await dbPool.query<InvoicesRequestRow[]>(sqlLastInvoiceNumber);
  const lastInvoiceNumber = lastInvoiceNumberResult[0]?.invoice_number || `0000000`;
  const numericValue = parseInt(lastInvoiceNumber, 10) + 1;
  const newInvoiceNumber = numericValue.toString().padStart(7, `0`);

  const sql = `
    INSERT INTO Invoices (
      currency, status, client_id, invoice_number, date_issued, due_date, subtotal, taxes, total_amount,
      company_name, company_address_street, company_address_zip, company_address_city, company_address_country, company_phone, company_email, company_tax_number, company_bank_account, company_website
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    `EUR`,
    InvoiceStatusEnum.Paid,
    customerId,
    newInvoiceNumber,
    toMySQLDate(invoiceData.dateIssued),
    getDueDate(toMySQLDate(invoiceData.dateIssued), invoiceData.dueDate),
    servicePriceSum.toFixed(2),
    serviceTaxAmountSum.toFixed(2),
    serviceTotalAmountSum.toFixed(2),
    companyInfo.name,
    companyInfo.addressStreet,
    companyInfo.addressZip,
    companyInfo.addressCity,
    companyInfo.addressCountry,
    companyInfo.phone,
    companyInfo.email,
    companyInfo.taxNumber,
    companyInfo.bankAccount,
    companyInfo.website,
  ];

  const [results] = await dbPool.query<ResultSetHeader>(sql, values);

  for (const invoiceDataService of invoiceData.services) {
    const {
      serviceId,
      serviceName,
      serviceQuantity,
      servicePrice,
      serviceTaxRate,
      serviceTaxAmount,
      serviceTotalAmount,
    } = calculateInvoiceTotals(invoiceDataService);

    const invoiceItemsQuery = `
      INSERT INTO InvoiceItems (
        invoice_id, service_id, service_name, service_quantity, service_price,
        service_tax_rate, service_tax_amount, service_total_amount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const invoiceItemsValues = [
      results.insertId,
      serviceId,
      serviceName,
      serviceQuantity,
      servicePrice.toFixed(2),
      serviceTaxRate.toFixed(2),
      serviceTaxAmount.toFixed(2),
      serviceTotalAmount.toFixed(2),
    ];

    await dbPool.query<ResultSetHeader>(invoiceItemsQuery, invoiceItemsValues);
  };

  return {
    createdInvoiceId: results.insertId,
    validationErrors: null,
  };
}

interface InvoiceTotals {
  serviceId: number | null;
  serviceName: string;
  serviceQuantity: number;
  servicePrice: number;
  serviceTaxRate: number;
  serviceTaxAmount: number;
  serviceTotalAmount: number;
}

const calculateInvoiceTotals = (invoiceDataService: InvoiceItemsData): InvoiceTotals => {
  const quantity = invoiceDataService.quantity;
  const priceNum = parseNumberWithComma(invoiceDataService.price);
  const taxRateNum = parseNumberWithComma(invoiceDataService.taxRate);
  const grossTotal = priceNum * quantity;

  let netTotal = 0;
  let taxTotal = 0;
  let netPricePerUnit = 0;
  let finalTotal = 0;

  if (invoiceDataService.isTaxesIncluded) {
    netPricePerUnit = priceNum / (1 + taxRateNum / 100);
    netTotal = netPricePerUnit * quantity;
    taxTotal = grossTotal - netTotal;
    finalTotal = grossTotal;
  } else {
    netPricePerUnit = priceNum;
    netTotal = netPricePerUnit * quantity;
    taxTotal = netTotal * (taxRateNum / 100);
    finalTotal = netTotal + taxTotal;
  }

  return {
    serviceId: invoiceDataService.id || null,
    serviceName: invoiceDataService.name,
    serviceQuantity: quantity,
    servicePrice: netPricePerUnit,
    serviceTaxRate: taxRateNum,
    serviceTaxAmount: taxTotal,
    serviceTotalAmount: finalTotal
  };
}

export {
  getInvoices,
  geInvoiceById,
  createInvoice,
};
