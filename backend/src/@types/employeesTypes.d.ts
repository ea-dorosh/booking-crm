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

export interface EmployeeAvailabilityRow extends RowDataPacket {
  id: number;
  employee_id: number;
  day_id: number;
  start_time: string;
  end_time: string;
}

export interface EmployeeAvailabilityDataType {
  id: number;
  employeeId: number;
  dayId: number;
  startTime: string;
  endTime: string;
}