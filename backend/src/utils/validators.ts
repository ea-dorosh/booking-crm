import validator from 'validator';
import { phone } from 'phone';

const validateEmail = (email: string) => {
  return validator.isEmail(email);
}

const validatePhone = (phoneNumber: string) => {
  if (!phone(phoneNumber, {country: `DE`}).isValid) {
    if (!phone(phoneNumber).isValid) {
      return false;
    }
  }

  return true;
}

export { 
  validateEmail,
  validatePhone,
};