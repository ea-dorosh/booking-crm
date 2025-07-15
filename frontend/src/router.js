import { createBrowserRouter } from 'react-router-dom';
import AccountPage from '@/pages/AccountPage/AccountPage';
import AppointmentDetailPage from '@/pages/AppointmentDetailPage/AppointmentDetailPage';
import AppointmentsPage from '@/pages/AppointmentsPage/AppointmentsPage';
import CompanyDetailPage from '@/pages/CompanyDetailPage/CompanyDetailPage';
import CustomerDetailPage from '@/pages/CustomerDetailPage/CustomerDetailPage';
import CustomersPage from '@/pages/CustomersPage/CustomersPage';
import DashboardPage from '@/pages/DashboardPage/DashboardPage';
import EmployeeDetailPage from '@/pages/EmployeeDetailPage/EmployeeDetailPage';
import EmployeesPage from '@/pages/EmployeesPage/EmployeesPage';
import ErrorPage from '@/pages/ErrorPage/ErrorPage';
import InvoiceDetailPage from '@/pages/InvoiceDetailPage/InvoiceDetailPage';
import InvoicesPage from '@/pages/InvoicesPage/InvoicesPage';
import LoginPage from '@/pages/LoginPage/LoginPage';
import OAuthCallbackPage from '@/pages/OAuthCallbackPage/OAuthCallbackPage';
import ForgotPasswordPage from '@/pages/PasswordResetPage/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/PasswordResetPage/ResetPasswordPage';
import RootPageWithOAuthHandler from '@/pages/RootPageWithOAuthHandler/RootPageWithOAuthHandler';
import ServiceCategoryDetailPage from '@/pages/ServiceCategoryDetailPage/ServiceCategoryDetailPage.js';
import ServicesDetailPage from '@/pages/ServicesDetailPage/ServicesDetailPage';
import ServicesPage from '@/pages/ServicesPage/ServicesPage';
import ServiceSubCategoryDetailPage from '@/pages/ServiceSubCategoryDetailPage/ServiceSubCategoryDetailPage.js';
import { ProtectedRoute } from '@/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: `/login`,
    element: <LoginPage />,
  },
  {
    path: `/forgot-password`,
    element: <ForgotPasswordPage />,
  },
  {
    path: `/reset-password`,
    element: <ResetPasswordPage />,
  },
  {
    path: `/`,
    element: (
      <ProtectedRoute>
        <RootPageWithOAuthHandler />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: `/dashboard`,
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: `/google-callback`,
    element: <OAuthCallbackPage />,
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
    path: `/company`,
    element: <ProtectedRoute>
      <CompanyDetailPage />
    </ProtectedRoute>,
  },
  {
    path: `/customers`,
    element: <ProtectedRoute>
      <CustomersPage />
    </ProtectedRoute>,
  },
  {
    path: `/customers/:customerId`,
    element: <ProtectedRoute>
      <CustomerDetailPage />
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
    path: `/invoices`,
    element: <ProtectedRoute>
      <InvoicesPage />
    </ProtectedRoute>,
  },
  {
    path: `/invoices/:invoiceId`,
    element: <ProtectedRoute>
      <InvoiceDetailPage />
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
    path: `/sub-categories/:subCategoryId`,
    element: <ProtectedRoute>
      <ServiceSubCategoryDetailPage />
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
