import { configureStore } from '@reduxjs/toolkit';
import appointmentSlice from '@/features/appointments/appointmentSlice';
import appointmentsSlice from '@/features/appointments/appointmentsSlice';
import counterReducer from '@/features/counter/counterSlice';
import employeeAvailabilitySlice from '@/features/employees/employeeAvailabilitySlice';
import employeesSlice from '@/features/employees/employeesSlice';
import serviceCategoriesSlice from '@/features/serviceCategories/serviceCategoriesSlice';
import servicesSlice from '@/features/services/servicesSlice';

export default configureStore({
  reducer: {
    appointments: appointmentsSlice,
    appointment: appointmentSlice,
    counter: counterReducer,
    employeeAvailability: employeeAvailabilitySlice,
    employees: employeesSlice,
    serviceCategories: serviceCategoriesSlice,
    services: servicesSlice,
  },
});