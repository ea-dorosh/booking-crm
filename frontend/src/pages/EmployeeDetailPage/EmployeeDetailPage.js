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
  Paper
} from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
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

export default function EmployeeDetailPage() {
  const [isEditMode, setIsEditMode] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { employeeId } = useParams();
  const employee = useSelector(state => state.employees.data.find(employee => employee.employeeId === Number(employeeId)));
  const { isCustomersDataRequestPending, lastAppointments, isLastAppointmentsPending } = useSelector(state => state.employees);

  const newEmployeeId = useSelector(state => state.employees.updateFormData);
  const formErrors = useSelector(state => state.employees.updateFormErrors);
  const updateFormStatus = useSelector(state => state.employees.updateFormStatus);

  const shouldShowCreateEmployeeForm = employeeId === `create-employee`;

  useEffect(() => {
    dispatch(fetchEmployeeAppointments(employeeId));

    if (!employee && !shouldShowCreateEmployeeForm) {
      dispatch(fetchEmployees());
    } else if (shouldShowCreateEmployeeForm) {
      setIsEditMode(true)
    }
  }, []);

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

  if (isEditMode) {
    return (
      <PageContainer
        pageTitle={employee ? `Edit ${employee.firstName} ${employee.lastName}` : `New Employee`}
        hideSideNav
      >
        <Box sx={{ padding: { xs: 1, md: 2 } }}>
          <GoBackNavigation />

          {(isCustomersDataRequestPending || isLastAppointmentsPending) && (
            <Box sx={{ marginTop: 2 }}>
              <LinearProgress />
            </Box>
          )}

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
              />

              {!shouldShowCreateEmployeeForm && (
                <Box sx={{ marginTop: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      dispatch(cleanErrors());
                      setIsEditMode(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
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

            {/* Recent Appointments */}
            {lastAppointments && (
              <Card sx={{ marginTop: 2 }}>
                <CardContent sx={{ padding: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 1.5, fontSize: '1.1rem' }}>
                    Recent Appointments
                  </Typography>
                  <EmployeeAppointments appointments={lastAppointments} />
                </CardContent>
              </Card>
            )}
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
