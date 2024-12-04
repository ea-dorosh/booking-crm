import { configureStore } from '@reduxjs/toolkit';
import appointmentSlice from '@/features/appointments/appointmentSlice';
import appointmentsSlice from '@/features/appointments/appointmentsSlice';
import counterReducer from '@/features/counter/counterSlice';
import customerReducer from '@/features/customers/customerSlice';
import customersReducer from '@/features/customers/customersSlice';
import employeeAvailabilitySlice from '@/features/employees/employeeAvailabilitySlice';
import employeesSlice from '@/features/employees/employeesSlice';
import serviceCategoriesSlice from '@/features/serviceCategories/serviceCategoriesSlice';
import servicesSlice from '@/features/services/servicesSlice';

export default configureStore({
  reducer: {
    appointment: appointmentSlice,
    appointments: appointmentsSlice,
    counter: counterReducer,
    customer: customerReducer,
    customers: customersReducer,
    employeeAvailability: employeeAvailabilitySlice,
    employees: employeesSlice,
    serviceCategories: serviceCategoriesSlice,
    services: servicesSlice,
  },
});