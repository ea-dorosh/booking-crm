import {
  CalendarToday,
  Schedule,
  Person,
  MiscellaneousServices,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { appointmentStatusEnum } from '@/enums/enums';
import {
  formatFromDateTimeToStringDate,
  formattedDateToTime,
  formatTimeToString,
} from "@/utils/formatters";

const getStatusConfig = (status) => {
  switch(status) {
  case appointmentStatusEnum.canceled:
    return { label: 'Canceled', color: 'error' };
  case appointmentStatusEnum.active:
    return { label: 'Active', color: 'success' };
  default:
    return { label: 'Unknown', color: 'default' };
  }
};

export default function EmployeeAppointments({ appointments, onAppointmentClick }) {
  if (!appointments || appointments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <Typography variant="body2">
          No appointments found
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {appointments.map((appointment) => {
        const statusConfig = getStatusConfig(appointment.status);

        return (
          <Card
            key={appointment.id}
            component={RouterLink}
            to={`/appointments/${appointment.id}`}
            onClick={onAppointmentClick}
            sx={{
              textDecoration: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              border: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <CardContent sx={{ padding: 2 }}>
              {/* Header with date and status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'primary.500' }} />
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    {formatFromDateTimeToStringDate(appointment.date)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Chip
                    label={statusConfig.label}
                    color={statusConfig.color}
                    size="small"
                    sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                  />
                  <Chip
                    label={`Added: ${formatFromDateTimeToStringDate(appointment.createdDate)}`}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '0.65rem', color: 'text.secondary' }}
                  />
                </Stack>
              </Box>

              {/* Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1.5 }}>
                <Schedule sx={{ fontSize: 16, color: 'grey.600' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {formattedDateToTime(appointment.timeStart)} - {formattedDateToTime(appointment.timeEnd)}
                </Typography>
              </Box>

              {/* Service */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1.5 }}>
                <MiscellaneousServices sx={{ fontSize: 16, color: 'grey.600' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {appointment.service.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Duration: {formatTimeToString(appointment.service.duration)}
                  </Typography>
                </Box>
              </Box>

              {/* Customer */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 16, color: 'grey.600' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {appointment.customer.firstName?.[0]}{appointment.customer.lastName?.[0]}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {appointment.customer.firstName} {appointment.customer.lastName}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
