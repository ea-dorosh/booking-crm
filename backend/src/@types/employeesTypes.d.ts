import { RowDataPacket } from 'mysql2';
import { Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { EmployeeStatusEnum } from '@/enums/enums.js';
import { TimeslotIntervalEnum } from '@/enums/enums.js';

export interface EmployeeDetailRowType extends RowDataPacket {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  image: string | null;
  status: EmployeeStatusEnum;
  advance_booking_time: string; // can be HH:MM:SS or 'next_day'
  timeslot_interval: TimeslotIntervalEnum;
}

export interface EmployeeDetailDataType {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  image: string;
  status: EmployeeStatusEnum;
  advanceBookingTime: string; // HH:MM format for frontend
  timeslotInterval: TimeslotIntervalEnum;
}

export interface EmployeeFormDataValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  advanceBookingTime?: string;
  timeslotInterval?: string;
}

export interface EmployeeValidationErrors {
  status?: string;
}

export interface UpdateEmployeeResult {
  employeeId: number | null;
  validationErrors: EmployeeValidationErrors | null;
}

export interface EmployeeAvailabilityRow extends RowDataPacket {
  id: number;
  employee_id: number;
  day_id: number;
  start_time: Time_HH_MM_SS_Type;
  end_time: Time_HH_MM_SS_Type;
}

export interface EmployeeAvailabilityDataType {
  id: number;
  employeeId: number;
  dayId: number;
  startTime: string;
  endTime: string;
  blockStartTimeFirst: Time_HH_MM_SS_Type;
  blockEndTimeFirst: Time_HH_MM_SS_Type;
}

interface GroupedAvailabilityDayType {
  dayId: number;
  employees: Array<{
    id: number;
    startTime: Time_HH_MM_SS_Type;
    endTime: Time_HH_MM_SS_Type;
    blockStartTimeFirst: Time_HH_MM_SS_Type | null;
    blockEndTimeFirst: Time_HH_MM_SS_Type | null;
    advanceBookingTime: string; // can be HH:MM:SS or 'next_day'
  }>;
}
