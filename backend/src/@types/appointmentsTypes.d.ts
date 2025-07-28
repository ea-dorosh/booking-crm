import { RowDataPacket } from 'mysql2';
import {
  AppointmentStatusEnum,
  CustomerNewStatusEnum,
} from '@/enums/enums.js';
import {
  Date_ISO_Type,
  Time_HH_MM_SS_Type,
} from '@/@types/utilTypes.js';
import { CustomerFormDataValidationErrors } from '@/@types/customersTypes.js';
import { CompanyResponseData } from '@/@types/companyTypes.js';

export interface AppointmentRowType extends RowDataPacket {
  id: number;
  date: string;
  created_date: string;
  service_name: string;
  time_start: string;
  service_duration: number;
  customer_last_name: string;
  customer_first_name: string;
  status: AppointmentStatusEnum;
}

export interface AppointmentDataType {
  id: number;
  date: string;
  createdDate: string;
  serviceName: string;
  timeStart: string;
  timeEnd: string;
  serviceDuration: number;
  customerLastName: string;
  customerFirstName: string;
  status: AppointmentStatusEnum;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    isCustomerNew: boolean;
  };
  employee: {
    id: number;
    firstName?: string;
    lastName?: string;
  };
}

export interface AppointmentDetailsRowType extends RowDataPacket {
  id: number;
  employee_id: number;
  date: string;
  time_start: string;
  time_end: string;
  service_id: number;
  service_duration: string;
  service_name: string;
  customer_id: number;
  created_date: string;
  customer_last_name: string;
  customer_first_name: string;
  is_customer_new: CustomerNewStatusEnum;
  status: AppointmentStatusEnum;
}

export interface AppointmentDetailType {
  id: number;
  date: string;
  timeStart: string;
  timeEnd: string;
  serviceDuration: string;
  serviceId: number;
  serviceName: string;
  createdDate: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    isCustomerNew: boolean;
  };
  employee: {
    id: number;
    firstName: string;
    lastName: string;
  };
  status: AppointmentStatusEnum;
  googleCalendarEventId: string | null;
  location: string;
}

export interface AppointmentFormDataType {
  date: Date_ISO_Type;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  service: AppointmentFormDataServiceType;
}

export interface ServiceBookingBaseType {
  employeeIds: number[];
  serviceId: number;
  startTime: Time_HH_MM_SS_Type;
}
export interface AppointmentFormDataServiceType extends ServiceBookingBaseType {
  secondService?: ServiceBookingBaseType;
}

export interface AppointmentFormDataServiceType {
  employeeIds: number[];
  serviceId: number;
  startTime: Time_HH_MM_SS_Type;
  secondService?: {
    employeeIds: number[];
    serviceId: number;
    startTime: Time_HH_MM_SS_Type;
  };
}

export interface AppointmentFormDataErrorsType {
  date?: string;
  service?: string;
}

export interface SavedAppointmentItemDataType {
  id: number;
  date: string;
  timeStart: string;
  timeEnd: string;
  createdDate: string;
  service: {
    id: number;
    name: string;
    duration: number;
  };
  employee: {
    id: number;
    firstName: string;
    lastName: string;
  };
  customer: {
    id: number,
    firstName: string,
    lastName: string,
  },
  status: string;
  location: string;
}

export interface CreateAppointmentServiceResponseErrorType {
  errorMessage: string;
  errors?: AppointmentFormDataErrorsType;
  error?: string;
  validationErrors?: CustomerFormDataValidationErrors;
}

export interface CreateAppointmentServiceResponseSuccessType {
  id: number;
  date: string;
  timeStart: string;
  serviceName: string;
  lastName: string;
  firstName: string;
  location: string;
  company: CompanyResponseData;
}
