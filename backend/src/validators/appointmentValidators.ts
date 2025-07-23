import {
  validateIsoDate,
  validateTime,
} from '@/utils/validators.js';
import {
  AppointmentFormDataErrorsType,
  AppointmentFormDataType,
} from '@/@types/appointmentsTypes.js';

const validateAppointmentDetailsData = (formData: AppointmentFormDataType): AppointmentFormDataErrorsType => {
  const errors: AppointmentFormDataErrorsType = {};

  if (!formData.date) {
    errors.date = `Date is required. Details: ${formData.date ? JSON.stringify(formData.date) : `No date provided`}`;
  } else if (!validateIsoDate(formData.date)) {
    errors.date = `Date is invalid. Details: ${JSON.stringify(formData.date)}. Expected format: YYYY-MM-DD`;
  }

  if (!formData.service?.serviceId || !formData.service.employeeIds?.length || !formData.service?.startTime || !validateTime(formData.service?.startTime)) {
    errors.service = `Service DATA is invalid. Details: ${formData.service ? JSON.stringify(formData.service) : `No service data provided`}. Expected format: { serviceId: number, employeeId: number[], startTime: string }`;
  }

  return errors;
};

export {
  validateAppointmentDetailsData,
};
