import { ServiceDataType, ServiceFormDataValidationErrors } from "@/@types/servicesTypes.js";

const validateServiceData = (service: ServiceDataType): ServiceFormDataValidationErrors => {
  const errors: ServiceFormDataValidationErrors = {};

  if (!service.name || service.name.length <= 3 ) {
    errors.name = `Service name must be at least 3 characters long`;
  }

  if (!service.durationTime || service.durationTime === `00:00:00`) {
    errors.durationTime = `Duration time is required`;
  }

  return errors;
};

export {
  validateServiceData,
}
