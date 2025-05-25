export interface ServiceDetailsDataType {
  id: number;
  name: string;
  categoryId: number;
  employeeIds: [];
  durationTime: string;
  bufferTime?: string;
  bookingNote: string | null;
}

export interface ServiceFormDataValidationErrors {
  name?: string;
  durationTime?: string;
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