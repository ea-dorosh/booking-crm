import { createSelector } from '@reduxjs/toolkit';

const selectServicesData = (state) => state.services.data;
const selectSelectedEmployees = (state) => state.services.selectedEmployees || [];
const selectSelectedCategories = (state) => state.services.selectedCategories || [];
const selectSelectedSubCategories = (state) => state.services.selectedSubCategories || [];

export const selectFilteredServices = createSelector(
  [selectServicesData, selectSelectedEmployees, selectSelectedCategories, selectSelectedSubCategories],
  (services, selectedEmployees, selectedCategories, selectedSubCategories) => {
    if (!services) {
      return services;
    }

    return services.filter(service => {
      // Filter by employees
      if (selectedEmployees.length > 0) {
        const hasSelectedEmployee = service.employeePrices?.some(empPrice =>
          selectedEmployees.includes(empPrice.employeeId),
        );
        if (!hasSelectedEmployee) return false;
      }

      // Filter by categories
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(service.categoryId)) {
          return false;
        }
      }

      // Filter by subcategories
      if (selectedSubCategories.length > 0) {
        if (!selectedSubCategories.includes(service.subCategoryId)) {
          return false;
        }
      }

      return true;
    });
  },
);