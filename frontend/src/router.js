import { createBrowserRouter } from 'react-router-dom';
import AppointmentDetailPage from './pages/AppointmentDetailPage/AppointmentDetailPage';
import AppointmentsPage from './pages/AppointmentsPage/AppointmentsPage';
import AccountPage from '@/pages/AccountPage/AccountPage';
import CustomersPage from '@/pages/CustomersPage/CustomersPage';
import DashboardPage from '@/pages/DashboardPage/DashboardPage';
import EmployeeDetailPage from '@/pages/EmployeeDetailPage/EmployeeDetailPage';
import EmployeesPage from '@/pages/EmployeesPage/EmployeesPage';
import ErrorPage from '@/pages/ErrorPage/ErrorPage';
import LoginPage from '@/pages/LoginPage/LoginPage';
import ServiceCategoryDetailPage from '@/pages/ServiceCategoryDetailPage/ServiceCategoryDetailPage';
import ServicesDetailPage from '@/pages/ServicesDetailPage/ServicesDetailPage';
import ServicesPage from '@/pages/ServicesPage/ServicesPage';
import { ProtectedRoute } from '@/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: `/appointments`,
    element: <ProtectedRoute>
      <AppointmentsPage />
    </ProtectedRoute>,
  },
  {
    path: `/appointments/:appointmentId`,
    element: <ProtectedRoute>
      <AppointmentDetailPage />
    </ProtectedRoute>,
  },
  {
    path: `/customers`,
    element: <ProtectedRoute>
      <CustomersPage />
    </ProtectedRoute>,
  },
  {
    path: `/employees`,
    element: <ProtectedRoute>
      <EmployeesPage />
    </ProtectedRoute>,
  },
  {
    path: `/employees/:employeeId`,
    element: <ProtectedRoute>
      <EmployeeDetailPage />
    </ProtectedRoute>,
  },
  {
    path: `/services`,
    element: <ProtectedRoute>
      <ServicesPage />
    </ProtectedRoute>,
  },
  {
    path: `/services/:serviceId`,
    element: <ProtectedRoute>
      <ServicesDetailPage />
    </ProtectedRoute>,
  },
  {
    path: `/categories/:categoryId`,
    element: <ProtectedRoute>
      <ServiceCategoryDetailPage />
    </ProtectedRoute>,
  },
  {
    path: `/account`,
    element: <ProtectedRoute>
      <AccountPage />
    </ProtectedRoute>,
  },
]);