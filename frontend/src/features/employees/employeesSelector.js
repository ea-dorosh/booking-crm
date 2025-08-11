import { createSelector } from '@reduxjs/toolkit';

const selectEmployeesData = (state) => state.employees.data;

export const selectEmployeeNameById = createSelector(
  [selectEmployeesData, (_state, employeeId) => employeeId],
  (employees, employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : ``;
  },
);

export const selectEmployeeById = createSelector(
  [selectEmployeesData, (_state, employeeId) => employeeId],
  (employees, employeeId) => employees.find(emp => emp.employeeId === employeeId),
);