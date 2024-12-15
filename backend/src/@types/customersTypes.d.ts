import { RowDataPacket } from 'mysql2';
import { 
  SalutationEnum,
} from '@/enums/enums';

export interface CustomerRowType extends RowDataPacket {
  customer_id: number;
  last_name: string;
  first_name: string;
  salutation: SalutationEnum;
  email: string;
  phone: string;
  added_date: string;
}

export interface CustomerDataType {
  salutation: SalutationEnum;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface CustomerFormDataValidationErrors {
  salutation?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}