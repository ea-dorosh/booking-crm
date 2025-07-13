import { Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';

export interface ServiceDetailsDataType {
  id: number;
  name: string;
  categoryId: number;
  employeeIds: [];
  durationTime: Time_HH_MM_SS_Type;
  bufferTime?: Time_HH_MM_SS_Type;
  bookingNote: string | null;
}

export interface ServiceFormDataValidationErrors {
  name?: string;
  categoryId?: string;
  durationTime?: string;
  employeePrices?: string;
}

export interface EmployeePriceType {
  price: number | null;
  employeeId: number;
}

export interface ServiceDataType {
  name: string;
  categoryId: number;
  durationTime: string;
  bufferTime: string;
  bookingNote: string;
  employeePrices: EmployeePriceType[];
}

export interface CategoryDataType {
  name: string;
  image: string;
}