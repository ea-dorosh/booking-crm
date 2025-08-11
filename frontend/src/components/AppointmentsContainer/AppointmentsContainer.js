import {
  Box,
  Typography,
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
  return (
    <Box>
      <Box
        sx={{
          display: `flex`,
          flexDirection: `column`,
          gap: `0.5rem`,
          marginTop: `2rem`,
          maxWidth: `768px`,
        }}
      >
        {appointments.length === 0 && <Typography
          variant="h5"
          sx={{
            textAlign: `center`,
            marginTop: `2rem`,
          }}
        >
          No upcoming appointments
        </Typography>}
        {appointments && appointments.map((appointment) => (
          <Box
            component={RouterLink}
            key={appointment.id}
            to={`/appointments/${appointment.id}`}
            sx={{
              display: `flex`,
              alignItems: `center`,
              width: `100%`,
              gap: `.4rem`,
              padding: `.8rem 0 .4rem 0`,
              borderBottom: `1px solid #ddd`,
              textDecoration: `none`,
              color: `#333`,
            }}
          >
            <Box sx={{
              flex: `0 0 40px`,
              display: `flex`,
              flexDirection: `column`,
              alignItems: `center`,
            }}>
              <Typography sx={{
                fontSize: `1.2rem`,
              }}>
                {getDay(appointment.date)}
              </Typography>

              <Typography sx={{
                fontSize: `.8rem`,
              }}>
                {getMonth(appointment.date)}
              </Typography>
            </Box>

            <Box sx={{
              flex: `1`,
              display: `flex`,
              flexDirection: `column`,
              position: `relative`,
            }}>
              {appointment.status === appointmentStatusEnum.canceled && <Box sx={{
                fontSize: `.5rem`,
                bgcolor: `red`,
                color: `#fff`,
                marginLeft: `auto`,
                position: `absolute`,
                padding: `1px 4px`,
                left: `0`,
                top: `-12px`,
              }}>
                canceled
              </Box>}

              <Typography
                sx={{
                  fontSize: `.8rem`,
                  color: `green`,
                  marginLeft: `auto`,
                  position: `absolute`,
                  right: `0`,
                  top: `-14px`,
                }}
              >
                {formatCreatedDate(appointment.createdDate)}
              </Typography>

              <Typography sx={{
                fontSize: `1rem`,
                fontWeight: `bold`,
              }}>
                {appointment.serviceName}
              </Typography>

              <Typography sx={{
                fontSize: `.8rem`,
              }}>
                {getDayOfWeek(appointment.date)}, {formattedDateToTime(appointment.timeStart)} ({formatTimeToString(appointment.serviceDuration)})
              </Typography>

              <Typography sx={{
                fontSize: `1rem`,
              }}>
                {appointment.customerLastName} {appointment.customerFirstName}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}