import { validateEmail, validatePhone } from '@/utils/validators.js';
import { CompanyResponseData, CompanyFormDataValidationErrors } from '@/@types/companyTypes.js';

const validateCompanyData = (formData: CompanyResponseData): CompanyFormDataValidationErrors => {
  const errors: CompanyFormDataValidationErrors = {};

  if (!formData.name?.length) {
    errors.name = `Name is required`;
  }

  if (formData.addressStreet && formData.addressStreet.length < 5) {
    errors.addressStreet = `Street must be at least 5 characters long`;
  }

  if (formData.addressZip && formData.addressZip.length < 4) {
    errors.addressZip = `Zip must be at least 4 characters long`;
  }

  if (formData.addressCity && formData.addressCity.length < 3) {
    errors.addressCity = `City must be at least 3 characters long`;
  }

  if (formData.addressCountry && formData.addressCountry.length < 3) {
    errors.addressCountry = `Country must be at least 3 characters long`;
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = `Invalid phone number`;
  }

  if (formData.email && !validateEmail(formData.email)) {
    errors.email = `Invalid email address`;
  }

  return errors;
};

export {
  validateCompanyData,
};
