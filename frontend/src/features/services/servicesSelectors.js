import { createSelector } from '@reduxjs/toolkit';

const selectServicesData = (state) => state.services.data;
const selectSelectedEmployees = (state) => state.services.selectedEmployees || [];

export const selectFilteredServices = createSelector(
  [selectServicesData, selectSelectedEmployees],
  (services, selectedEmployees) => {
    if (!services || selectedEmployees.length === 0) {
      return services;
    }

    return services.filter(service => {
      // Check if any of the service's employees match the selected employees
      return service.employeePrices?.some(empPrice =>
        selectedEmployees.includes(empPrice.employeeId)
      );
    });
  }
);