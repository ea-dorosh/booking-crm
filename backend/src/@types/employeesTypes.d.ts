import { RowDataPacket } from 'mysql2';

export interface EmployeeDetailRowType extends RowDataPacket {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  image: string | null;
}

export interface EmployeeDetailDataType {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  image: string;
}

export interface EmployeeFormDataValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}