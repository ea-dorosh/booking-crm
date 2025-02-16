import { validateEmail, validatePhone } from '@/utils/validators.js';
import { SalutationEnum } from '@/enums/enums.js';
import { CustomerResponseData, CustomerFormDataValidationErrors } from '@/@types/customersTypes.js';

const validateCustomerData = (formData: CustomerResponseData): CustomerFormDataValidationErrors => {
  const errors: CustomerFormDataValidationErrors = {};

  if (!formData.salutation || !(formData.salutation in SalutationEnum)) {
    errors.salutation = `Please choose a salutation`;
  }

  if (!formData.email?.length) {
    errors.email = `Email is required`;
  } else if (!validateEmail(formData.email)) {
    errors.email = `Invalid email address`;
  }

  if (!formData.firstName!.length) {
    errors.firstName = `First name is required`;
  }

  if (!formData.lastName!.length) {
    errors.lastName = `Last name is required`;
  }

  if (!formData.phone?.length) {
    errors.phone = `Phone number is required`;
  } else if (!validatePhone(formData.phone)) {
    errors.phone = `Invalid phone number`;
  }

  return errors;
};

export {
  validateCustomerData,
};
