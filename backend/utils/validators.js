const validator = require('validator');
const { phone } = require('phone');

const validateEmail = (email) => {
  return validator.isEmail(email);
}

const validatePhone = (phoneNumber) => {
  if (!phone(phoneNumber, {country: `DE`}).isValid) {
    if (!phone(phoneNumber).isValid) {
      return false;
    }
  }

  return true;
}

module.exports = {
  validateEmail,
  validatePhone,
};