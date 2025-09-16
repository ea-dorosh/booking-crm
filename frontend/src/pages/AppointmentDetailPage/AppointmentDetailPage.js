import {
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Receipt as ReceiptIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  EventNote as EventIcon,
} from '@mui/icons-material';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import {
  Typography,
  Box,
  LinearProgress,
  Button,
  Card,
  Chip,
  Stack,
  Grid,
  Avatar,
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

  const {
    data: appointment, isPending,
  } = useSelector(state => state.appointment);

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
        <Box
          sx={{
            mt: 2,
            mb: 4,
          }}
        >
          {/* Compact Header */}
          <Card
            sx={{
              mb: 3,
              p: 3,
            }}
          >
            <Box
              sx={{
                display: `flex`,
                justifyContent: `space-between`,
                alignItems: `flex-start`,
                flexWrap: `wrap`,
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: `text.primary`,
                    mb: 1,
                  }}
                >
                  {appointment.serviceName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontWeight: 500,
                  }}
                >
                  Appointment #{appointment.id}
                </Typography>
              </Box>

              <Chip
                label={appointment.status === appointmentStatusEnum.active ? `Active` : `Canceled`}
                color={appointment.status === appointmentStatusEnum.active ? `success` : `error`}
                sx={{
                  fontWeight: 600,
                  fontSize: `0.875rem`,
                }}
              />
            </Box>
          </Card>

          {/* Main Content Grid */}
          <Grid
            container
            spacing={2}
          >
            {/* Schedule Information */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card
                sx={{
                  height: `100%`,
                  p: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: `text.primary`,
                  }}
                >
                  Schedule Details
                </Typography>

                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: `flex`,
                      alignItems: `center`,
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: `primary.100`,
                        color: `primary.main`,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <CalendarIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: `0.8rem` }}
                      >
                        Date
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500 }}
                      >
                        {formatIsoDate(appointment.date)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: `flex`,
                      alignItems: `center`,
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: `secondary.100`,
                        color: `secondary.main`,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <TimeIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: `0.8rem` }}
                      >
                        Time
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500 }}
                      >
                        {formattedDateToTime(appointment.timeStart)} - {formattedDateToTime(appointment.timeEnd)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: `flex`,
                      alignItems: `center`,
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: `warning.100`,
                        color: `warning.main`,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <ScheduleIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: `0.8rem` }}
                      >
                        Duration
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500 }}
                      >
                        {formatTimeToString(appointment.serviceDuration)}
                      </Typography>
                    </Box>
                  </Box>

                  {appointment.location && (
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 1.5,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: `info.100`,
                          color: `info.main`,
                          width: 32,
                          height: 32,
                        }}
                      >
                        <LocationIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: `0.8rem` }}
                        >
                          Location
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500 }}
                        >
                          {appointment.location}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Card>
            </Grid>

            {/* People Information */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card
                sx={{
                  height: `100%`,
                  p: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: `text.primary`,
                  }}
                >
                  People Involved
                </Typography>

                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      border: `1px solid`,
                      borderColor: `grey.200`,
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <PersonIcon
                        sx={{
                          fontSize: `1rem`,
                          color: `text.secondary`,
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          textTransform: `uppercase`,
                          fontWeight: 600,
                          letterSpacing: `0.5px`,
                        }}
                      >
                        Client
                      </Typography>
                      {appointment.customer.isCustomerNew && (
                        <Chip
                          label="New"
                          size="small"
                          color="success"
                          sx={{
                            fontSize: `0.7rem`,
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      component={RouterLink}
                      to={`/customers/${appointment.customer.id}`}
                      variant="body1"
                      sx={{
                        color: `primary.main`,
                        textDecoration: `none`,
                        fontWeight: 600,
                        display: `block`,
                        '&:hover': {
                          textDecoration: `underline`,
                        },
                      }}
                    >
                      {appointment.customer.lastName} {appointment.customer.firstName}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      border: `1px solid`,
                      borderColor: `grey.200`,
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <BadgeIcon
                        sx={{
                          fontSize: `1rem`,
                          color: `text.secondary`,
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          textTransform: `uppercase`,
                          fontWeight: 600,
                          letterSpacing: `0.5px`,
                        }}
                      >
                        Master
                      </Typography>
                    </Box>
                    <Typography
                      component={RouterLink}
                      to={`/employees/${appointment.employee.id}`}
                      variant="body1"
                      sx={{
                        color: `primary.main`,
                        textDecoration: `none`,
                        fontWeight: 600,
                        display: `block`,
                        '&:hover': {
                          textDecoration: `underline`,
                        },
                      }}
                    >
                      {appointment.employee.lastName} {appointment.employee.firstName}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            {/* Creation Info */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card
                sx={{
                  p: 2,
                  bgcolor: `grey.50`,
                  border: `1px solid`,
                  borderColor: `grey.200`,
                }}
              >
                <Box
                  sx={{
                    display: `flex`,
                    alignItems: `center`,
                    gap: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `primary.100`,
                      color: `primary.main`,
                      width: 32,
                      height: 32,
                    }}
                  >
                    <EventIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: `0.8rem` }}
                    >
                      Created
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: `primary.main`,
                      }}
                    >
                      {formatCreatedDate(appointment.createdDate)}
                    </Typography>
                  </Box>
                </Box>

                {appointment.orderMessage && (
                  <Box
                    sx={{
                      display: `flex`,
                      alignItems: `flex-start`,
                      gap: 1.5,
                      mt: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: `success.100`,
                        color: `success.main`,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <TextSnippetIcon fontSize="small" />
                    </Avatar>

                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: `0.8rem` }}
                      >
                        Nachricht des Kunden
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: `pre-wrap` }}
                      >
                        {appointment.orderMessage}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Actions */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card
                sx={{
                  p: 2,
                  height: `100%`,
                  display: `flex`,
                  flexDirection: `column`,
                  justifyContent: `center`,
                }}
              >
                <Stack
                  spacing={1.5}
                  sx={{
                    height: `100%`,
                    justifyContent: `center`,
                  }}
                >
                  {appointment.status === appointmentStatusEnum.active && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => handleCancelAppointment(appointment.id)}
                      fullWidth
                    >
                      Cancel Appointment
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<ReceiptIcon />}
                    onClick={handleCreateInvoice}
                    fullWidth
                  >
                    Create Invoice
                  </Button>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </PageContainer>
  );
}
