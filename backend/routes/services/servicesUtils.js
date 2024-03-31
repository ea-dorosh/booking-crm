const validateServiceForm = (service) => {
  const errors = {};

  if (!service.employeeIds || !Array.isArray(service.employeeIds) || !service.employeeIds.length) {
    errors.employeeIds = `Choose at least one empolyee for the service`;
  }

  if (!service.name || service.name.length <= 3 ) {
    errors.name = `Service name must be at least 3 characters long`;
  }

  if (!service.durationTime || service.durationTime === `00:00:00`) {
    errors.durationTime = `Duration time is required`;
  }

  return errors;
};

module.exports = {
  validateServiceForm,
};
