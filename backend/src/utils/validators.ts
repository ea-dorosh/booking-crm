import validator from 'validator';
import { phone } from 'phone';

/**
 * Validate email format
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 */
const validateEmail = (email: string) => {
  return validator.isEmail(email);
}

/**
 * Validate phone number format
 * @param phoneNumber - The phone number string to validate
 * @returns true if the phone number is valid, false otherwise
 */
const validatePhone = (phoneNumber: string) => {
  if (!phone(phoneNumber, {country: `DE`}).isValid) {
    if (!phone(phoneNumber).isValid) {
      return false;
    }
  }

  return true;
}

/**
 * Validate ISO date format
 * @param date - The date string to validate (YYYY-MM-DD)
 * @returns true if the date is valid, false otherwise
 */
const validateIsoDate = (date: string) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && validator.isISO8601(date);
};

/**
 * Validate time format
 * @param time - The time string to validate (HH:MM:SS)
 * @returns true if the time is valid, false otherwise
 */
const validateTime = (time: string) => {
  return /^\d{2}:\d{2}:\d{2}$/.test(time);
};

export {
  validateEmail,
  validatePhone,
  validateIsoDate,
  validateTime,
};