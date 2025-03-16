import {
  validateEmail,
  validatePhone,
  validateIsoDate,
  validateTime,
} from '@/utils/validators.js';
import {
  AppointmentFormDataErrorsType,
  AppointmentFormDataType,
  AppointmentFormDataValidationErrorsType,
} from '@/@types/appointmentsTypes.js';

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

const validateAppointmentCustomerData = (formData: AppointmentFormDataType, publicErrors: boolean = false): AppointmentFormDataValidationErrorsType => {
  const errors: AppointmentFormDataValidationErrorsType = {};

  if (!formData.email) {
    errors.email = publicErrors ? `Bitte geben Sie eine gültige E-Mail-Adresse ein`: `Email is required`;
  } else if (!validateEmail(formData.email)) {
    errors.email = publicErrors ? `Bitte geben Sie eine gültige E-Mail-Adresse ein`: `Email is invalid`;
  }

  if (!formData.firstName) {
    errors.firstName = publicErrors ? `Bitte geben Sie Ihren Vornamen ein`: `First name is required`;
  }

  if (!formData.lastName) {
    errors.lastName = publicErrors ? `Bitte geben Sie Ihren Nachnamen ein`: `Last name is required`;
  }

  if (!formData.phone) {
    errors.phone = publicErrors ? `Bitte geben Sie Ihre Telefonnummer ein`: `Phone is required`;
  } else if (!validatePhone(formData.phone)) {
    errors.phone = publicErrors ? `Bitte geben Sie eine gültige Telefonnummer ein +49 000 00 000 00`: `Phone is invalid`;
  }

  if (!formData.salutation) {
    errors.salutation = publicErrors ? `Bitte wählen Sie eine Anrede aus`: `Salutation is required`;
  }

  return errors;
};

export {
  validateAppointmentCustomerData,
  validateAppointmentDetailsData,
};
