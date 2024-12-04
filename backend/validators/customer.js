const { validateEmail, validatePhone } = require('../utils/validators');
const { salutationEnum } = require('../enums/enums');

const validateCustomerForm = (formData) => {
  const errors = {};
  

  if (formData.salutation !== salutationEnum.male && formData.salutation !== salutationEnum.female) {
    errors.salutation = `Please choose a salutation`;
  }

  if (!formData.email.length) {
    errors.email = `Email is required`;
  } else if (!validateEmail(formData.email)) {
    errors.email = `Invalid email address`;
  }

  if ((!formData.firstName.length)) {
    errors.firstName = `First name is required`;
  }

  if ((!formData.lastName.length)) {
    errors.lastName = `Last name is required`;
  }

  if (!formData.phone.length) {
    errors.phone = `Phone number is required`;
  } else if (!validatePhone(formData.phone)) {
    errors.phone = `Invalid phone number`;
  }

  return errors;
};

module.exports = {
  validateCustomerForm,
};
