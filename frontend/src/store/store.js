import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '@/features/counter/counterSlice';
import employeeAvailabilitySlice from '@/features/employees/employeeAvailabilitySlice';
import employeesSlice from '@/features/employees/employeesSlice';

export default configureStore({
  reducer: {
    counter: counterReducer,
    employeeAvailability: employeeAvailabilitySlice,
    employees: employeesSlice,
  },
});