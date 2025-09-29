import { createSelector } from '@reduxjs/toolkit';

const selectEmployeesData = (state) => state.employees.data;

// Selector for filtering employees by status
export const selectEmployeesByStatus = createSelector(
  [selectEmployeesData, (state, statusFilter) => statusFilter],
  (employees, statusFilter) => {
    if (!employees) {
      return employees;
    }

    if (statusFilter === `all`) {
      return employees;
    }

    return employees.filter(employee => employee.status === statusFilter);
  },
);
