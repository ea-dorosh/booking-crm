import {
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Grid,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { appointmentStatusEnum } from '@/enums/enums';
import {
  formattedDateToTime,
  formatCreatedDate,
  getDay,
  getMonth,
  getDayOfWeek,
  formatTimeToString,
} from '@/utils/formatters';

export default function AppointmentsContainer({ appointments }) {
  if (appointments.length === 0) {
    return (
      <Box
        sx={{
          textAlign: `center`,
          py: 8,
        }}
      >
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            mb: 1,
          }}
        >
          No appointments found
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Try adjusting your filters or check a different date range.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `column`,
        gap: 1,
      }}
    >
      {appointments.map((appointment) => (
        <Card
          key={appointment.id}
          component={RouterLink}
          to={`/appointments/${appointment.id}`}
          sx={{
            textDecoration: `none`,
            cursor: `pointer`,
            position: `relative`,
            height: `100%`,
          }}
        >
          <CardContent
            sx={{
              p: 2,
              '&:last-child': {
                pb: 2,
              },
            }}
          >
            {/* Status Chip in top right */}
            <Chip
              label={appointment.status === appointmentStatusEnum.active ? `Active` : `Canceled`}
              color={appointment.status === appointmentStatusEnum.active ? `success` : `error`}
              size="small"
              sx={{
                position: `absolute`,
                top: 12,
                right: 12,
                fontWeight: 600,
                fontSize: `0.75rem`,
              }}
            />

            <Grid
              container
              spacing={0}
              alignItems="center"
            >
              {/* Compact Date Column */}
              <Grid
                item
                xs={12}
                sm={3}
                md={2}
              >
                <Box
                  sx={{
                    display: `flex`,
                    alignItems: `center`,
                    justifyContent: `flex-start`,
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: `primary.main`,
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    {getDay(appointment.date)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: `uppercase`,
                      fontWeight: 600,
                      letterSpacing: `0.5px`,
                      fontSize: `0.7rem`,
                    }}
                  >
                    {getMonth(appointment.date)} • {getDayOfWeek(appointment.date)}
                  </Typography>
                </Box>
              </Grid>

              {/* Main Content */}
              <Grid
                item
                xs={12}
                sm={9}
                md={7}
              >
                <Stack spacing={0}>
                  <Typography
                    variant="subtitle1"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      color: `text.primary`,
                      lineHeight: 1.3,
                      pr: 8, // Space for status chip
                    }}
                  >
                    {appointment.serviceName}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    sx={{
                      '& > *': {
                        fontSize: `0.8rem`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 0.5,
                      }}
                    >
                      <TimeIcon
                        sx={{
                          fontSize: `0.9rem`,
                          color: `text.secondary`,
                        }}
                      />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: `0.8rem` }}
                      >
                        {formattedDateToTime(appointment.timeStart)} - {formattedDateToTime(appointment.timeEnd)}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: `0.8rem` }}
                    >
                      {formatTimeToString(appointment.serviceDuration)}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                  >
                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 0.5,
                      }}
                    >
                      <PersonIcon
                        sx={{
                          fontSize: `0.9rem`,
                          color: `text.secondary`,
                        }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: `0.8rem`,
                        }}
                      >
                        {appointment.customerLastName} {appointment.customerFirstName}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: `flex`,
                        alignItems: `center`,
                        gap: 0.5,
                      }}
                    >
                      <BadgeIcon
                        sx={{
                          fontSize: `0.9rem`,
                          color: `text.secondary`,
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: `0.8rem` }}
                      >
                        {appointment.employee?.lastName} {appointment.employee?.firstName}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Grid>

              {/* Created Date - Compact */}
              <Grid
                item
                xs={12}
                sm={12}
                md={3}
              >
                <Box
                  sx={{
                    display: `flex`,
                    alignItems: `flex-start`,
                    gap: 1,
                    textAlign: {
                      xs: `left`,
                      md: `right`,
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      textTransform: `uppercase`,
                      fontWeight: 600,
                      letterSpacing: `0.5px`,
                      fontSize: `0.7rem`,
                    }}
                  >
                    Created
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: `primary.main`,
                      fontSize: `0.8rem`,
                      display: `block`,
                    }}
                  >
                    {formatCreatedDate(appointment.createdDate)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
