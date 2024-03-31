const { validateEmail, validatePhone } = require('../../utils/validators');

const validateEmployeeForm = (employee) => {
  const errors = {};

  if (!employee.firstName || employee.firstName.length < 2 ) {
    errors.firstName = `Service name must be at least 2 characters long`;
  }

  if (!employee.lastName || employee.lastName.length < 2 ) {
    errors.lastName = `Service name must be at least 2 characters long`;
  }

  if (!validateEmail(employee.email)) {
    errors.email = `Invalid email address`;
  }

  if (!validatePhone(employee.phone)) {
    errors.phone = `Invalid phone number`;
  }

  return errors;
};

module.exports = {
  validateEmployeeForm,
};
