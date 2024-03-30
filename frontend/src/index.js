import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Provider } from 'react-redux';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage/DashboardPage';
import EmployeeDetailPage from '@/pages/EmployeeDetailPage/EmployeeDetailPage';
import EmployeesPage from '@/pages/EmployeesPage/EmployeesPage';
import ErrorPage from '@/pages/ErrorPage/ErrorPage';
import ServicesPage from '@/pages/ServicesPage/ServicesPage';
import store from '@/store/store';

const router = createBrowserRouter([
  {
    path: `/`,
    element: <DashboardPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: `/employees`,
    element: <EmployeesPage />,
  },
  {
    path: `/employees/:employeeId`,
    element: <EmployeeDetailPage />,
  },
  {
    path: `/services`,
    element: <ServicesPage />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
