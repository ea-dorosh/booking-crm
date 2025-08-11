import validator from 'validator';
import { phone } from 'phone';
import {
  Date_ISO_Type,
  Time_HH_MM_SS_Type,
} from '@/@types/utilTypes.js';

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
  if (!phone(phoneNumber, { country: `DE` }).isValid) {
    if (!phone(phoneNumber).isValid) {
      return false;
    }
  }

  return true;
}

/**
 * Validate ISO date format
 * @param date - The date string to validate (ISO 8601 format)
 * @returns true if the date is valid, false otherwise
 */
const validateIsoDate = (date: Date_ISO_Type) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
};

/**
 * Validate time format
 * @param time - The time string to validate (HH:MM:SS)
 * @returns true if the time is valid, false otherwise
 */
const validateTime = (time: Time_HH_MM_SS_Type) => {
  return /^\d{2}:\d{2}:\d{2}$/.test(time);
};

export {
  validateEmail,
  validatePhone,
  validateIsoDate,
  validateTime,
};