import { RowDataPacket } from 'mysql2';
import {
  InvoiceStatusEnum,
  SalutationEnum,
} from '@/enums/enums.js';
import { CustomerFormDataValidationErrors } from '@/@types/customersTypes.js';

export interface InvoicesRequestRow extends RowDataPacket {
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

export interface InvoiceByIdRequestRow extends RowDataPacket {
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

export interface InvoiceItemsRequestRow extends RowDataPacket {
  id: number;
  invoice_id: number;
  service_id?: number;
  service_name: string;
  service_quantity: number;
  service_price: string;
  service_tax_rate: string;
  service_tax_amount: string;
  service_total_amount: string;
}

export interface InvoiceResponseData {
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

export interface InvoiceByIdResponseData {
  id: number;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  }
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber: string;
    bankAccount: string;
    website: string;
  }
  invoiceNumber: string;
  dateIssued: string;
  dueDate: string;
  status: InvoiceStatusEnum;
  subtotal: string;
  taxes: string;
  totalAmount: string;
  currency: string;
  servicesItems: Array<InvoiceServiceItem>| null;
}

export interface InvoiceServiceItem {
  id: number;
  serviceId?: number | null;
  serviceName: string;
  serviceQuantity: number;
  servicePrice: string;
  serviceTaxRate: string;
  serviceTaxAmount: string;
  serviceTotalAmount: string;
}

export interface InvoiceUpdatedData {
  customerId: number | null;
  isNewCustomer: boolean;
  salutation?: SalutationEnum | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  id: number;
  dateIssued: string;
  dueDate: number;
  status: InvoiceStatusEnum;
  currency: string;
  services: Array<InvoiceItemsData>;
}

export interface InvoiceItemsData {
  id?: number | null;
  name: string;
  price: string;
  quantity: number;
  taxRate: string;
  isTaxesIncluded: boolean;
}

export interface InvoiceFormDataValidationErrors extends CustomerFormDataValidationErrors {
  dateIssued?: string;
  dueDate?: string;
  status?: string;
  subtotal?: string;
  taxes?: string;
  totalAmount?: string;
  customerId?: string;
  services?: Array<{
    id?: string;
    name?: string;
    price?: string;
    quantity?: string;
    taxRate?: string;
    isTaxesIncluded?: string;
  }>
}