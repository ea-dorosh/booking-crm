import { EmployeeDetailDataType, EmployeeFormDataValidationErrors } from '@/@types/employeesTypes.js';
import { validateEmail, validatePhone } from '@/utils/validators.js';

const validateEmployeeData = (employee: EmployeeDetailDataType): EmployeeFormDataValidationErrors => {
  const errors: EmployeeFormDataValidationErrors = {};

  if (!employee.firstName || employee.firstName.length < 2 ) {
    errors.firstName = `First name must be at least 2 characters long`;
  }

  if (!employee.lastName || employee.lastName.length < 2 ) {
    errors.lastName = `Last name must be at least 2 characters long`;
  }

  if (!employee.email || employee.email.trim() === '') {
    errors.email = `Email is required`;
  } else if (!validateEmail(employee.email)) {
    errors.email = `Invalid email address`;
  }

  if (!employee.phone || employee.phone.trim() === '') {
    errors.phone = `Phone is required`;
  } else if (!validatePhone(employee.phone)) {
    errors.phone = `Invalid phone number`;
  }

  return errors;
};

export {
  validateEmployeeData,
}
