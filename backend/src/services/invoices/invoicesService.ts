import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { InvoiceStatusEnum } from '@/enums/enums';
import { getCustomers } from '@/services/customer/customerService';
import dayjs from 'dayjs';

interface InvoiceRow extends RowDataPacket {
  id: number;
  client_id: number;
  invoice_number: string;
  date_issued: string;
  due_date: string;
  status: InvoiceStatusEnum;
  subtotal: string;
  taxes: string;
  total_amount: string;
  currency: string;
}

interface InvoiceData {
  id: number;
  customer: {
    id: number;
    firstName: string;
    lastName: string
  }
  invoiceNumber: string;
  dateIssued: string;
  dueDate: string;
  status: InvoiceStatusEnum;
  subtotal: string;
  taxes: string;
  totalAmount: string;
  currency: string;
}

async function getInvoices(dbPool: Pool): Promise<InvoiceData[]> {
  const customers = await getCustomers(dbPool);

  const sql = `
    SELECT *
    FROM Invoices
  `;

  const [result] = await dbPool.query<InvoiceRow[]>(sql);

  const invoices: InvoiceData[] = result.map((row) => ({
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

export {
  getInvoices,
};
