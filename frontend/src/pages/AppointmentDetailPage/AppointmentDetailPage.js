import {
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Receipt as ReceiptIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  Typography,
  Box,
  LinearProgress,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
  Paper,
  Grid,
} from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import { appointmentStatusEnum } from '@/enums/enums';
import {
  fetchAppointment,
  clearAppointment,
  cancelAppointment,
} from '@/features/appointments/appointmentSlice';
import {
  formattedDateToTime,
  formatCreatedDate,
  formatTimeToString,
  formatIsoDate,
} from '@/utils/formatters';

export default function AppointmentDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { appointmentId } = useParams();

  const {data: appointment, isPending} = useSelector(state => state.appointment);

  useEffect(() => {
    dispatch(fetchAppointment(appointmentId));

    return () => {
      dispatch(clearAppointment());
    };
  }, []);

  const handleCancelAppointment = async (id) => {
    await dispatch(cancelAppointment(id));
    dispatch(fetchAppointment(appointmentId));
  };

  const handleCreateInvoice = () => {
    const queryParams = new URLSearchParams();

    queryParams.append(`appointmentId`, appointmentId);
    queryParams.append(`customerId`, appointment?.customer?.id);
    queryParams.append(`serviceId`, appointment?.serviceId);

    // Navigate to invoice creation with all parameters
    navigate(`/invoices/create-invoice?${queryParams.toString()}`);
  };

  return (
    <PageContainer
      pageTitle="Appointment Detail"
      hideSideNav
    >
      <GoBackNavigation />

      {isPending && <LinearProgress />}

      {appointment && (
        <Box sx={{ mt: 3, mb: 5 }}>
          <Card elevation={3} sx={{ mb: 4, overflow: `visible` }}>
            <Box
              sx={{
                p: 2,
                bgcolor: `primary.main`,
                color: `white`,
                position: `relative`,
              }}
            >
              <Typography variant="h5" fontWeight="bold">
                {appointment.serviceName}
              </Typography>
              <Chip
                label={appointment.status === appointmentStatusEnum.active ? "Active" : "Canceled"}
                color={appointment.status === appointmentStatusEnum.active ? "success" : "error"}
                sx={{
                  position: `absolute`,
                  top: 16,
                  right: 16,
                  fontWeight: `bold`,
                }}
              />
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: `flex`, alignItems: `center`, mb: 2 }}>
                    <CalendarIcon sx={{ mr: 1, color: `primary.main` }} />
                    <Typography variant="body1">
                      <strong>Date:</strong> {formatIsoDate(appointment.date)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: `flex`, alignItems: `center`, mb: 2 }}>
                    <TimeIcon sx={{ mr: 1, color: `primary.main` }} />
                    <Typography variant="body1">
                      <strong>Time:</strong> {formattedDateToTime(appointment.timeStart)} - {formattedDateToTime(appointment.timeEnd)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: `flex`, alignItems: `center`, mb: 2 }}>
                    <ScheduleIcon sx={{ mr: 1, color: `primary.main` }} />
                    <Typography variant="body1">
                      <strong>Duration:</strong> {formatTimeToString(appointment.serviceDuration)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: `grey.50` }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      APPOINTMENT CREATED
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" color="primary.main">
                      {formatCreatedDate(appointment.createdDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {appointment.createdDate}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: `flex`, alignItems: `center` }}>
                    <PersonIcon sx={{ mr: 1, color: `primary.main` }} />
                    <Typography variant="body1" sx={{ mr: 1 }}>
                      <strong>Client:</strong>
                    </Typography>
                    <Typography
                      component={RouterLink}
                      to={`/customers/${appointment.customer.id}`}
                      sx={{
                        color: `primary.main`,
                        textDecoration: `none`,
                        fontWeight: `medium`,
                        '&:hover': {
                          textDecoration: `underline`,
                        }
                      }}
                    >
                      {appointment.customer.lastName} {appointment.customer.firstName}
                    </Typography>

                    {appointment.customer.isCustomerNew && (
                      <Chip
                        label="New Client"
                        size="small"
                        color="success"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: `flex`, alignItems: `center` }}>
                    <BadgeIcon sx={{ mr: 1, color: `primary.main` }} />
                    <Typography variant="body1" sx={{ mr: 1 }}>
                      <strong>Master:</strong>
                    </Typography>
                    <Typography
                      component={RouterLink}
                      to={`/employees/${appointment.employee.id}`}
                      sx={{
                        color: `primary.main`,
                        textDecoration: `none`,
                        fontWeight: `medium`,
                        '&:hover': {
                          textDecoration: `underline`,
                        }
                      }}
                    >
                      {appointment.employee.lastName} {appointment.employee.firstName}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Stack direction={{ xs: `column`, sm: `row` }} spacing={2}>
            {appointment.status === appointmentStatusEnum.active && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleCancelAppointment(appointment.id)}
              >
                Cancel Appointment
              </Button>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={<ReceiptIcon />}
              onClick={handleCreateInvoice}
            >
              Create Invoice
            </Button>
          </Stack>
        </Box>
      )}
    </PageContainer>
  );
}
