import { Edit, Person, Email, Phone, CalendarMonth } from "@mui/icons-material";
import {
  Button,
  Typography,
  Box,
  LinearProgress,
  Card,
  CardContent,
  Avatar,
  Grid,
  Stack,
  Chip,
  Paper,
  CircularProgress
} from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import AppointmentFilters from "@/components/EmployeeAppointments/AppointmentFilters";
import EmployeeAppointments from "@/components/EmployeeAppointments/EmployeeAppointments";
import EmployeeAvailability from "@/components/EmployeeAvailability/EmployeeAvailability";
import EmployeeForm from "@/components/EmployeeForm/EmployeeForm";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import GoogleCalendarIntegration from '@/components/GoogleCalendarIntegration/GoogleCalendarIntegration';
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  fetchEmployees,
  fetchEmployeeAppointments,
  updateEmployee,
  cleanError,
  cleanErrors,
  resetUpdateFormStatus,
} from '@/features/employees/employeesSlice';
import { getDefaultAppointmentFilters } from '@/utils/appointmentFilters';

// SessionStorage keys
const APPOINTMENT_FILTERS_KEY = 'employeeAppointmentFilters';
const SCROLL_POSITION_KEY = 'employeeDetailScrollPosition';

// Get filters from sessionStorage or defaults
const getInitialFilters = (employeeId) => {
  if (!employeeId || employeeId === 'create-employee') {
    return getDefaultAppointmentFilters();
  }

  const key = `${APPOINTMENT_FILTERS_KEY}_${employeeId}`;
  const savedFilters = sessionStorage.getItem(key);

  if (savedFilters) {
    try {
      const parsedFilters = JSON.parse(savedFilters);
      return parsedFilters;
    } catch (error) {
      console.warn('Failed to parse saved appointment filters:', error);
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
  const { isCustomersDataRequestPending, lastAppointments, isLastAppointmentsPending } = useSelector(state => state.employees);

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

      dispatch(fetchEmployeeAppointments({ id: employeeId, filters }));
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

  const handleFiltersChange = (newFilters) => {
    setAppointmentFilters(newFilters);

    // Save filters to sessionStorage
    if (employeeId && employeeId !== 'create-employee') {
      const key = `${APPOINTMENT_FILTERS_KEY}_${employeeId}`;
      sessionStorage.setItem(key, JSON.stringify(newFilters));
    }
  };

  const handleClearFilters = () => {
    const defaultFilters = getDefaultAppointmentFilters();

    setAppointmentFilters(defaultFilters);

    // Clear filters from sessionStorage
    if (employeeId && employeeId !== 'create-employee') {
      sessionStorage.removeItem(`${APPOINTMENT_FILTERS_KEY}_${employeeId}`);
    }
  };

  const handleAppointmentClick = () => {
    sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
  };

  if (isEditMode) {
    return (
      <PageContainer
        pageTitle={employee ? `Edit ${employee.firstName} ${employee.lastName}` : `New Employee`}
        hideSideNav
      >
        <Box sx={{ padding: { xs: 1, md: 2 } }}>
          <Box sx={{ marginTop: 1, position: 'relative' }}>
            {(isCustomersDataRequestPending || isLastAppointmentsPending) && (
              <LinearProgress />
            )}
          </Box>

          <GoBackNavigation />

          <Card sx={{ marginTop: 2 }}>
            <CardContent sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 600, fontSize: '1.2rem' }}>
                {shouldShowCreateEmployeeForm ? 'Create New Employee' : 'Edit Employee Information'}
              </Typography>

              <EmployeeForm
                employee={employee}
                createEmployee={updateEmployeeHandler}
                formErrors={formErrors}
                cleanError={handleCleanError}
                cleanErrors={handleCleanErrors}
                onCancel={() => {
                  dispatch(cleanErrors());
                  setIsEditMode(false);
                }}
              />


            </CardContent>
          </Card>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      pageTitle={employee ? `${employee.firstName} ${employee.lastName}` : `Employee Details`}
      hideSideNav
    >
      <Box sx={{ padding: { xs: 1, md: 2 } }}>
        <GoBackNavigation />

        {(isCustomersDataRequestPending || isLastAppointmentsPending) && (
          <Box sx={{ marginTop: 2 }}>
            <LinearProgress />
          </Box>
        )}

        {employee && (
          <>
            {/* Employee Info Card */}
            <Card sx={{ marginTop: 2 }}>
              <CardContent sx={{ padding: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Edit sx={{ fontSize: '16px' }} />}
                    onClick={() => {
                      dispatch(cleanErrors());
                      setIsEditMode(true);
                    }}
                    sx={{
                      borderRadius: 1,
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      minWidth: 'auto'
                    }}
                  >
                    Edit
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {/* Employee Avatar & Status */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}>
                      <Avatar
                        src={employee.image}
                        sx={{
                          width: 100,
                          height: 100,
                          marginBottom: 1.5,
                          border: '3px solid',
                          borderColor: 'primary.50',
                        }}
                      >
                        <Person sx={{ fontSize: 50 }} />
                      </Avatar>

                      <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 1 }}>
                        {`${employee.firstName} ${employee.lastName}`}
                      </Typography>

                      <Chip
                        label="Active"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Grid>

                  {/* Employee Information */}
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ padding: 2, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 1.5, fontSize: '1.1rem' }}>
                        Contact Information
                      </Typography>

                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Email sx={{ color: 'primary.500', fontSize: 18 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Email Address
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {employee.email}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Phone sx={{ color: 'primary.500', fontSize: 18 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Phone Number
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {employee.phone || 'Not provided'}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Google Calendar Integration */}
            <Card sx={{ marginTop: 2 }}>
              <CardContent sx={{ padding: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 1.5, fontSize: '1.1rem' }}>
                  <CalendarMonth sx={{ verticalAlign: 'middle', marginRight: 1, fontSize: '1.2rem' }} />
                  Calendar Integration
                </Typography>
                <GoogleCalendarIntegration employeeId={employee.employeeId} />
              </CardContent>
            </Card>

            {/* Employee Availability */}
            <Card sx={{ marginTop: 2 }}>
              <CardContent sx={{ padding: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 1.5, fontSize: '1.1rem' }}>
                  Work Schedule
                </Typography>
                <EmployeeAvailability employeeId={employee.employeeId} />
              </CardContent>
            </Card>

            {/* Recent Appointments with Filters */}
            <Box sx={{ marginTop: 2, position: 'relative' }}>
              <AppointmentFilters
                filters={appointmentFilters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                appointmentsCount={lastAppointments?.length || 0}
              />

              {/* Appointments Container with Overlay */}
              <Box sx={{ position: 'relative' }}>
                {/* Appointments Content */}
                {lastAppointments && lastAppointments.length > 0 && (
                  <EmployeeAppointments appointments={lastAppointments} onAppointmentClick={handleAppointmentClick} />
                )}

                {/* Show message when no appointments */}
                {((lastAppointments && lastAppointments.length === 0) || (!lastAppointments && !isLastAppointmentsPending)) && (
                  <Box sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <Typography variant="body2">
                      {lastAppointments ? 'No appointments found with current filters' : 'No appointments yet'}
                    </Typography>
                  </Box>
                )}

                {/* Loading Overlay */}
                {isLastAppointmentsPending && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: lastAppointments && lastAppointments.length > 0 ? 0 : 'auto',
                      minHeight: lastAppointments && lastAppointments.length === 0 ? '200px' : 'auto',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <CircularProgress size={24} thickness={4} />
                      <Typography variant="body2" color="text.secondary">
                        Loading appointments...
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}

        {!employee && !shouldShowCreateEmployeeForm && (
          <Card sx={{ marginTop: 2 }}>
            <CardContent sx={{ padding: 4, textAlign: 'center' }}>
              <Person sx={{ fontSize: 48, color: 'grey.400', marginBottom: 1.5 }} />
              <Typography variant="h6" color="text.secondary" sx={{ marginBottom: 1, fontSize: '1.1rem' }}>
                Employee not found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The employee you&apos;re looking for doesn&apos;t exist or has been removed.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </PageContainer>
  );
}
