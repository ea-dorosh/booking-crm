const { validateEmail, validatePhone } = require('../../utils/validators');
const { salutationEnum } = require('../../enums/enums');

const validateCustomerForm = (formData) => {
  const errors = {};

  if (formData.salutation !== salutationEnum.male && formData.salutation !== salutationEnum.female) {
      errors.salutation = `Please choose a salutation`;
    }

  if (!validateEmail(formData.email)) {
    errors.email = `Invalid email address`;
  }

  if ((!formData.firstName.length)) {
    errors.firstName = `Invalid first name`;
  }

  if ((!formData.lastName.length)) {
    errors.lastName = `Invalid last name`;
  }

  if (!validatePhone(formData.phone)) {
    errors.phone = `Invalid phone number`;
  }

  return errors;
};

module.exports = {
  validateCustomerForm,
};
