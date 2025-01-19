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

const validateIsoDate = (date: string) => {  
  return validator.isISO8601(date);
};

export { 
  validateEmail,
  validatePhone,
  validateIsoDate,
};