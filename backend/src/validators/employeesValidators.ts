import { EmployeeDetailDataType, EmployeeFormDataValidationErrors } from '@/@types/employeesTypes.js';
import { validateEmail, validatePhone } from '@/utils/validators.js';
import { ADVANCE_BOOKING_NEXT_DAY, TimeslotIntervalEnum } from '@/enums/enums.js';

const validateEmployeeData = (employee: EmployeeDetailDataType): EmployeeFormDataValidationErrors => {
  const errors: EmployeeFormDataValidationErrors = {};

  if (!employee.firstName || employee.firstName.length < 2 ) {
    errors.firstName = `First name must be at least 2 characters long`;
  }

  if (!employee.lastName || employee.lastName.length < 2 ) {
    errors.lastName = `Last name must be at least 2 characters long`;
  }

  if (!employee.email || employee.email.trim() === ``) {
    errors.email = `Email is required`;
  } else if (!validateEmail(employee.email)) {
    errors.email = `Invalid email address`;
  }

  if (!employee.phone || employee.phone.trim() === ``) {
    errors.phone = `Phone is required`;
  } else if (!validatePhone(employee.phone)) {
    errors.phone = `Invalid phone number`;
  }

  // Validate advance booking time format (HH:MM or 'next_day')
  if (employee.advanceBookingTime) {
    const timePattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    const isNextDay = employee.advanceBookingTime === ADVANCE_BOOKING_NEXT_DAY;
    if (!timePattern.test(employee.advanceBookingTime) && !isNextDay) {
      errors.advanceBookingTime = `Advance booking time must be in format HH:MM or '${ADVANCE_BOOKING_NEXT_DAY}'`;
    }
  }

  // Validate timeslot interval
  const validIntervals = Object.values(TimeslotIntervalEnum);
  if (!employee.timeslotInterval || !validIntervals.includes(employee.timeslotInterval as TimeslotIntervalEnum)) {
    errors.timeslotInterval = `Timeslot interval is required and must be one of: ${validIntervals.join(`, `)}`;
  }

  return errors;
};

export {
  validateEmployeeData,
}
