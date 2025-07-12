import { RowDataPacket } from 'mysql2';
import {
  SalutationEnum,
} from '@/enums/enums.js';

export interface CustomerRequestRow extends RowDataPacket {
  customer_id: number;
  last_name: string;
  first_name: string;
  salutation: SalutationEnum;
  email: string;
  phone: string;
  added_date: string;
  last_activity_date: string;
}

export interface CustomerResponseData {
  salutation?: SalutationEnum | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressCountry?: string;
}

export interface CustomerFormDataValidationErrors {
  salutation?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}