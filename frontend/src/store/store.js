import { configureStore } from '@reduxjs/toolkit';
import appointmentSlice from '@/features/appointments/appointmentSlice';
import appointmentsSlice from '@/features/appointments/appointmentsSlice';
import companyBranchSlice from '@/features/company/companyBranchSlice';
import companySlice from '@/features/company/companySlice';
import counterReducer from '@/features/counter/counterSlice';
import customerReducer from '@/features/customers/customerSlice';
import customersReducer from '@/features/customers/customersSlice';
import employeeAvailabilitySlice from '@/features/employees/employeeAvailabilitySlice';
import employeeSchedulePeriodsSlice from '@/features/employees/employeeSchedulePeriodsSlice';
import employeesSlice from '@/features/employees/employeesSlice';
import invoiceSlice from '@/features/invoices/invoiceSlice';
import invoicesSlice from '@/features/invoices/invoicesSlice';
import serviceCategoriesSlice from '@/features/serviceCategories/serviceCategoriesSlice';
import servicesSlice from '@/features/services/servicesSlice';
import serviceSubCategoriesSlice from '@/features/serviceSubCategories/serviceSubCategoriesSlice';
import trackingSlice from '@/features/tracking/trackingSlice';

export default configureStore({
  reducer: {
    appointment: appointmentSlice,
    appointments: appointmentsSlice,
    counter: counterReducer,
    companyBranch: companyBranchSlice,
    company: companySlice,
    customer: customerReducer,
    customers: customersReducer,
    employeeAvailability: employeeAvailabilitySlice,
    employeeSchedulePeriods: employeeSchedulePeriodsSlice,
    employees: employeesSlice,
    invoice: invoiceSlice,
    invoices: invoicesSlice,
    serviceSubCategories: serviceSubCategoriesSlice,
    serviceCategories: serviceCategoriesSlice,
    services: servicesSlice,
    tracking: trackingSlice,
  },
});
