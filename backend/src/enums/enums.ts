export enum CustomerNewStatusEnum {
  Existing = 0,
  New = 1,
}

export enum SalutationEnum {
  Male = 0,
  Female = 1,
}

export enum AppointmentStatusEnum {
  Active = 0,
  Canceled = 1,
}

export enum CustomerSourceEnum {
  Manual = 0,
  Booking = 1,
}

export enum PaymentMethodEnum {
  PayInPerson = 0,
  ApplePay = 1,
  CreditDebitCards = 2,
  Giropay = 3,
  OnlineBankTransfer = 4,
}

export enum PaymentStatusEnum {
  Declined = 0,
  Refunded = 1,
  Successful = 2,
}

export enum InvoiceStatusEnum {
  Paid = 1,
}

// Default sorting constants
export const DEFAULT_APPOINTMENT_SORT_FIELD = `date` as const;
export const DEFAULT_SORT_DIRECTION = `desc` as const;

export enum CategoryStatusEnum {
  Active = `active`,
  Archived = `archived`,
  Disabled = `disabled`,
}

export enum EmployeeStatusEnum {
  Active = `active`,
  Archived = `archived`,
  Disabled = `disabled`,
}

// Feature flags (temporary hardcoded switches)
export const FEATURE_FLAGS = {
  employeeSchedulePeriods: true,
};
