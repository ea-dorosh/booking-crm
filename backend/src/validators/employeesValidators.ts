import { EmployeeDetailDataType, EmployeeFormDataValidationErrors } from '@/@types/employeesTypes';
import { validateEmail, validatePhone } from '@/utils/validators';

const validateEmployeeData = (employee: EmployeeDetailDataType): EmployeeFormDataValidationErrors => {
  const errors: EmployeeFormDataValidationErrors = {};

  if (!employee.firstName || employee.firstName.length < 2 ) {
    errors.firstName = `Service name must be at least 2 characters long`;
  }

  if (!employee.lastName || employee.lastName.length < 2 ) {
    errors.lastName = `Service name must be at least 2 characters long`;
  }

  if (employee.email && !validateEmail(employee.email)) {
    errors.email = `Invalid email address`;
  }

  if (employee.phone && !validatePhone(employee.phone)) {
    errors.phone = `Invalid phone number`;
  }

  return errors;
};

export {
  validateEmployeeData,
}
