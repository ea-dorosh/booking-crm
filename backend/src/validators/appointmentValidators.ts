import {
  validateEmail,
  validatePhone,
  validateIsoDate,
  validateTime,
} from '@/utils/validators.js';
import {
  AppointmentFormDataErrorsType,
  AppointmentFormDataType,
} from '@/@types/appointmentsTypes.js';
import { SalutationEnum } from '@/enums/enums.js';

const validateAppointmentDetailsData = (formData: AppointmentFormDataType): AppointmentFormDataErrorsType => {
  const errors: AppointmentFormDataErrorsType = {};

  if (!formData.date) {
    errors.date = `Date is required`;
  } else if (!validateIsoDate(formData.date)) {
    errors.date = `Date is invalid`;
  }

  if (!formData.employeeId) {
    errors.employeeId = `Employee ID is required`;
  }

  if (!formData.serviceId) {
    errors.serviceId = `Service ID is required`;
  }

  if (!formData.time) {
    errors.time = `Time is required`;
  } else if (!validateTime(formData.time)) {
    errors.time = `Time is invalid`;
  }

  return errors;
};

export {
  validateAppointmentDetailsData,
};
