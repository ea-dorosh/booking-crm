// Utility functions for form handling

/**
 * Initialize form data with default values
 * @param {Object} entity - Entity data for edit mode
 * @param {Array} fields - Array of field configurations
 * @returns {Object} Initialized form data
 */
export const initializeFormData = (entity, fields) => {
  const isEditMode = Boolean(entity);

  return fields.reduce((acc, field) => {
    acc[field.name] = isEditMode
      ? entity[field.name] || field.defaultValue || ``
      : field.defaultValue || ``;
    return acc;
  }, {});
};

/**
 * Create form data object for submission
 * @param {Object} entity - Original entity (for edit mode)
 * @param {Object} formData - Current form data
 * @returns {Object} Combined data for submission
 */
export const createSubmitData = (entity, formData) => {
  return {
    ...entity,
    ...formData,
  };
};

/**
 * Check if form has errors
 * @param {Object} formErrors - Form errors object
 * @returns {boolean} True if form has errors
 */
export const hasFormErrors = (formErrors) => {
  return formErrors && Object.keys(formErrors).length > 0;
};

/**
 * Clean specific field error
 * @param {Function} cleanError - Error cleaning function
 * @param {Object} formErrors - Form errors object
 * @param {string} fieldName - Field name to clean
 */
export const cleanFieldError = (cleanError, formErrors, fieldName) => {
  if (formErrors && formErrors[fieldName] && cleanError) {
    cleanError(fieldName);
  }
};

/**
 * Validate required fields
 * @param {Object} formData - Form data
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation errors
 */
export const validateRequiredFields = (formData, requiredFields) => {
  const errors = {};

  requiredFields.forEach(fieldName => {
    if (!formData[fieldName] || formData[fieldName].toString().trim() === ``) {
      errors[fieldName] = `${fieldName} is required`;
    }
  });

  return errors;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format form data for API submission
 * @param {Object} data - Raw form data
 * @returns {Object} Formatted data
 */
export const formatFormData = (data) => {
  const formatted = {};

  Object.keys(data).forEach(key => {
    const value = data[key];

    // Handle empty strings
    if (value === ``) {
      formatted[key] = null;
    }
    // Handle boolean strings
    else if (value === `true` || value === `false`) {
      formatted[key] = value === `true`;
    }
    // Handle numbers
    else if (!isNaN(value) && value !== ``) {
      formatted[key] = Number(value);
    }
    else {
      formatted[key] = value;
    }
  });

  return formatted;
};

/**
 * Format service data for API submission
 * @param {Object} entity - Original entity (for edit mode)
 * @param {Object} formData - Current form data
 * @returns {Object} Formatted service data
 */
export const createServiceSubmitData = (entity, formData) => {
  const submitData = {
    ...entity,
    ...formData,
  };

  // Process subCategoryId - convert empty string to null
  if (submitData.subCategoryId === ``) {
    submitData.subCategoryId = null;
  }

  // Process employee prices - convert empty strings to null, but allow 0
  if (submitData.employeePrices && Array.isArray(submitData.employeePrices)) {
    submitData.employeePrices = submitData.employeePrices.map(emp => ({
      ...emp,
      price: emp.price === `` || emp.price === null || emp.price === undefined ? null : Number(emp.price)
    }));
  }

  return submitData;
};

/**
 * Format employee data for API submission
 * @param {Object} entity - Original entity (for edit mode)
 * @param {Object} formData - Current form data
 * @returns {Object} Formatted employee data
 */
export const createEmployeeSubmitData = (entity, formData) => {
  const submitData = {
    ...entity,
    ...formData,
  };

  // Process email and phone - keep empty strings for validation
  if (submitData.email === ``) {
    submitData.email = ``;
  }

  if (submitData.phone === ``) {
    submitData.phone = ``;
  }

  return submitData;
};

/**
 * Format customer data for API submission
 * @param {Object} entity - Original entity (for edit mode)
 * @param {Object} formData - Current form data
 * @returns {Object} Formatted customer data
 */
export const createCustomerSubmitData = (entity, formData) => {
  const submitData = {
    ...entity,
    ...formData,
  };

  // Process salutation - convert to number if it's a string
  if (typeof submitData.salutation === 'string') {
    submitData.salutation = Number(submitData.salutation);
  }

  // Process email and phone - keep empty strings for validation
  if (submitData.email === ``) {
    submitData.email = ``;
  }

  if (submitData.phone === ``) {
    submitData.phone = ``;
  }

  return submitData;
};