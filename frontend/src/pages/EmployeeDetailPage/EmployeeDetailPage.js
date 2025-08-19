import { Box, LinearProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import EmployeeDetails from '@/components/EmployeeDetails/EmployeeDetails';
import EmployeeEditForm from '@/components/EmployeeEditForm/EmployeeEditForm';
import EmployeeNotFound from '@/components/EmployeeNotFound/EmployeeNotFound';
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import { employeeStatusEnum } from '@/enums/enums';
import {
  fetchEmployees,
  fetchEmployeeAppointments,
  updateEmployee,
  updateEmployeeStatus,
  cleanError,
  cleanErrors,
  resetUpdateFormStatus,
} from '@/features/employees/employeesSlice';
import { getDefaultAppointmentFilters } from '@/utils/appointmentFilters';

// SessionStorage keys
const APPOINTMENT_FILTERS_KEY = `employeeAppointmentFilters`;
const SCROLL_POSITION_KEY = `employeeDetailScrollPosition`;

// Get filters from sessionStorage or defaults
const getInitialFilters = (employeeId) => {
  if (!employeeId || employeeId === `create-employee`) {
    return getDefaultAppointmentFilters();
  }

  const key = `${APPOINTMENT_FILTERS_KEY}_${employeeId}`;
  const savedFilters = sessionStorage.getItem(key);

  if (savedFilters) {
    try {
      const parsedFilters = JSON.parse(savedFilters);
      return parsedFilters;
    } catch (error) {
      console.warn(`Failed to parse saved appointment filters:`, error);
    }
  }

  const defaultFilters = getDefaultAppointmentFilters();
  return defaultFilters;
};

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [appointmentFilters, setAppointmentFilters] = useState(() => getInitialFilters(employeeId));

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const employee = useSelector(state => state.employees.data.find(employee => employee.employeeId === Number(employeeId)));
  const {
    isCustomersDataRequestPending, lastAppointments, isLastAppointmentsPending,
  } = useSelector(state => state.employees);

  const newEmployeeId = useSelector(state => state.employees.updateFormData);
  const formErrors = useSelector(state => state.employees.updateFormErrors);
  const updateFormStatus = useSelector(state => state.employees.updateFormStatus);

  const shouldShowCreateEmployeeForm = employeeId === `create-employee`;

  // Load appointments with filters
  const loadAppointments = () => {
    if (employeeId && !shouldShowCreateEmployeeForm) {
      const filters = {};
      if (appointmentFilters.startDate) filters.startDate = appointmentFilters.startDate;
      if (appointmentFilters.endDate) filters.endDate = appointmentFilters.endDate;

      filters.status = appointmentFilters.status;
      if (appointmentFilters.sortBy) filters.sortBy = appointmentFilters.sortBy;
      if (appointmentFilters.sortOrder) filters.sortOrder = appointmentFilters.sortOrder;

      dispatch(fetchEmployeeAppointments({
        id: employeeId,
        filters,
      }));
    }
  };

  useEffect(() => {
    // Only handle employee data loading and edit mode setup
    if (!employee && !shouldShowCreateEmployeeForm) {
      dispatch(fetchEmployees());
    } else if (shouldShowCreateEmployeeForm) {
      setIsEditMode(true);
    }
  }, [employeeId]);

  // Load appointments when filters change
  useEffect(() => {
    // Load appointments if we have employeeId and not in create mode
    if (employeeId && !shouldShowCreateEmployeeForm) {
      loadAppointments();
    }
  }, [appointmentFilters]);

  // Restore scroll position after appointments are loaded
  useEffect(() => {
    if (!shouldShowCreateEmployeeForm && !isLastAppointmentsPending && lastAppointments !== null) {
      const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);

      if (savedScrollPosition) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          setTimeout(() => {
            const targetScroll = parseInt(savedScrollPosition, 10);
            window.scrollTo(0, targetScroll);

            sessionStorage.removeItem(SCROLL_POSITION_KEY);
          }, 200);
        });
      }
    }
  }, [lastAppointments, isLastAppointmentsPending, shouldShowCreateEmployeeForm]);

  useEffect(() => {
    (async () => {
      if (updateFormStatus === `succeeded`) {
        await dispatch(fetchEmployees());
        setIsEditMode(false);
        dispatch(resetUpdateFormStatus());

        if (newEmployeeId) {
          navigate(`/employees/${newEmployeeId}`);
        }
      }
    })();
  }, [updateFormStatus]);

  const updateEmployeeHandler = (employee) => {
    dispatch(updateEmployee(employee));
  };

  const handleCleanError = (fieldName) => {
    dispatch(cleanError(fieldName));
  };

  const handleCleanErrors = () => {
    dispatch(cleanErrors());
  };

  const handleCancelEdit = () => {
    dispatch(cleanErrors());
    setIsEditMode(false);
  };

  const handleEditClick = () => {
    dispatch(cleanErrors());
    setIsEditMode(true);
  };

  const handleFiltersChange = (newFilters) => {
    setAppointmentFilters(newFilters);

    // Save filters to sessionStorage
    if (employeeId && employeeId !== `create-employee`) {
      const key = `${APPOINTMENT_FILTERS_KEY}_${employeeId}`;
      sessionStorage.setItem(key, JSON.stringify(newFilters));
    }
  };

  const handleClearFilters = () => {
    const defaultFilters = getDefaultAppointmentFilters();

    setAppointmentFilters(defaultFilters);

    // Clear filters from sessionStorage
    if (employeeId && employeeId !== `create-employee`) {
      sessionStorage.removeItem(`${APPOINTMENT_FILTERS_KEY}_${employeeId}`);
    }
  };

  const handleAppointmentClick = () => {
    sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
  };

  // Determine page title
  const getPageTitle = () => {
    if (isEditMode) {
      return employee ? `Edit ${employee.firstName} ${employee.lastName}` : `New Employee`;
    }
    if (!employee && !shouldShowCreateEmployeeForm) {
      return `Employee Not Found`;
    }
    return employee ? `${employee.firstName} ${employee.lastName}` : `Employee Details`;
  };

  const handleArchiveToggle = async () => {
    if (!employee) return;
    const isArchived = employee.status === employeeStatusEnum.archived;
    const nextStatus = isArchived ? employeeStatusEnum.active : employeeStatusEnum.archived;

    await dispatch(updateEmployeeStatus({
      employeeId: employee.employeeId,
      status: nextStatus,
    }));

    await dispatch(fetchEmployees([`all`]));
  };

  const handleDeactivateToggle = async () => {
    if (!employee) return;
    const isDisabled = employee.status === employeeStatusEnum.disabled;
    const nextStatus = isDisabled ? employeeStatusEnum.active : employeeStatusEnum.disabled;

    await dispatch(updateEmployeeStatus({
      employeeId: employee.employeeId,
      status: nextStatus,
    }));

    await dispatch(fetchEmployees([`all`]));
  };

  // Determine content to render
  const renderContent = () => {
    // Show edit form
    if (isEditMode) {
      return (
        <EmployeeEditForm
          employee={employee}
          shouldShowCreateEmployeeForm={shouldShowCreateEmployeeForm}
          updateEmployeeHandler={updateEmployeeHandler}
          formErrors={formErrors}
          handleCleanError={handleCleanError}
          handleCleanErrors={handleCleanErrors}
          handleCancelEdit={handleCancelEdit}
        />
      );
    }

    // Show not found
    if (!employee && !shouldShowCreateEmployeeForm) {
      return <EmployeeNotFound />;
    }

    // Show employee details
    if (employee) {
      return (
        <EmployeeDetails
          employee={employee}
          appointmentFilters={appointmentFilters}
          lastAppointments={lastAppointments}
          isLastAppointmentsPending={isLastAppointmentsPending}
          handleFiltersChange={handleFiltersChange}
          handleClearFilters={handleClearFilters}
          handleAppointmentClick={handleAppointmentClick}
          handleEditClick={handleEditClick}
          handleArchiveToggle={handleArchiveToggle}
          handleDeactivateToggle={handleDeactivateToggle}
        />
      );
    }

    // Loading state
    return null;
  };

  return (
    <PageContainer
      pageTitle={getPageTitle()}
      hideSideNav
    >
      <Box
        sx={{
          padding: {
            xs: 1,
            md: 2,
          },
        }}
      >
        {!isEditMode && <GoBackNavigation />}

        {(isCustomersDataRequestPending || isLastAppointmentsPending) && (
          <Box sx={{ marginTop: 1 }}>
            <LinearProgress />
          </Box>
        )}

        {renderContent()}
      </Box>
    </PageContainer>
  );
}
