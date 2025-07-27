import { validateEmail, validatePhone } from '@/utils/validators.js';
import { CustomerResponseData, CustomerFormDataValidationErrors } from '@/@types/customersTypes.js';
import { AppointmentFormDataType } from '@/@types/appointmentsTypes.js';

const validateCustomerData = ({
  formData,
  publicErrors = false,
}: {
  formData: AppointmentFormDataType | CustomerResponseData;
  publicErrors: boolean;
}): CustomerFormDataValidationErrors => {
  const errors: CustomerFormDataValidationErrors = {};

  if (!formData.email || !formData.email?.length) {
    errors.email = publicErrors ?
      `Bitte geben Sie eine gültige E-Mail-Adresse ein` :
      `Email is required`;
  } else if (!validateEmail(formData.email)) {
    errors.email = publicErrors ?
      `Bitte geben Sie eine gültige E-Mail-Adresse ein` :
      `Email is invalid`;
  }

  if (!formData.firstName || !formData.firstName?.length) {
    errors.firstName = publicErrors ?
      `Bitte geben Sie Ihren Vornamen ein` :
      `First name is required`;
  }

  if (!formData.lastName || !formData.lastName?.length) {
    errors.lastName = publicErrors ?
      `Bitte geben Sie Ihren Nachnamen ein` :
      `Last name is required`;
  }

  if (!formData.phone || !formData.phone?.length) {
    errors.phone = publicErrors ?
      `Bitte geben Sie Ihre Telefonnummer ein` :
      `Phone is required`;
  } else if (!validatePhone(formData.phone)) {
    errors.phone = publicErrors ?
      `Bitte geben Sie eine gültige Telefonnummer ein +49 123 11 222 33` :
      `Phone is invalid`;
  }

  return errors;
};

export {
  validateCustomerData,
};
