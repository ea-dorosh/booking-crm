import { createBrowserRouter } from 'react-router-dom';
import AccountPage from '@/pages/AccountPage/AccountPage';
import DashboardPage from '@/pages/DashboardPage/DashboardPage';
import EmployeeDetailPage from '@/pages/EmployeeDetailPage/EmployeeDetailPage';
import EmployeesPage from '@/pages/EmployeesPage/EmployeesPage';
import ErrorPage from '@/pages/ErrorPage/ErrorPage';
import LoginPage from '@/pages/LoginPage/LoginPage';
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
    path: `/account`,
    element: <ProtectedRoute>
      <AccountPage />
    </ProtectedRoute>,
  },
]);