import { ServiceDataType, ServiceFormDataValidationErrors } from "@/@types/servicesTypes.js";

const validateServiceData = (service: ServiceDataType): ServiceFormDataValidationErrors => {
  const errors: ServiceFormDataValidationErrors = {};

  if (!service.name || service.name.length <= 3 ) {
    errors.name = `Service name must be at least 3 characters long`;
  }

  if (!service.subCategoryId || service.subCategoryId <= 0) {
    errors.subCategoryId = `Service category is required`;
  }

  if (!service.durationTime || service.durationTime === `00:00:00`) {
    errors.durationTime = `Duration time is required`;
  }

    // Validate employee prices
  if (service.employeePrices && service.employeePrices.length > 0) {
    const invalidPrices = service.employeePrices.filter(emp =>
      emp.price === null || emp.price === undefined || emp.price < 0
    );

    if (invalidPrices.length > 0) {
      errors.employeePrices = `All selected employees must have a valid price (0 or greater)`;
    }
  }

  return errors;
};

export {
  validateServiceData,
}
