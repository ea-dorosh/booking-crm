import {
  Box,
  Typography, 
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { appointmentStatusEnum } from '@/enums/enums';
import { formatFromDateTimeToStringDate } from "@/utils/formatters";

export default function CustomerSavedAppointments({ appointments }) {

  return (<>
    <Typography variant="h5">
      Appointments
    </Typography>

    {appointments.length === 0 && <Typography
      sx={{
        marginTop: `1rem`,
      }}
    ><i>No appointments yet</i>
    </Typography>}

    {appointments.length > 0 && <Box 
      sx={{
        display: `flex`,
        flexDirection: `column`,
        gap: `.5rem`,
        marginTop: `1rem`,
        maxWidth: `768px`,
      }}
    >
      {appointments.map((appointment, index) => (
        <Box
          key={appointment.id}
          component={RouterLink}
          to={`/appointments/${appointment.id}`}
          sx={{
            display: `flex`,
            alignItems: `flex-start`,
            flexDirection: `column`,
            width: `100%`,
            gap: `.4rem`,
            padding: `.8rem 0 .4rem 0`,
            borderBottom: index !== appointments.length - 1 && `1px solid #ddd`,
            textDecoration: `none`,
            color: `#333`,
            position: `relative`,
          }}
        >
          {appointment.status === appointmentStatusEnum.canceled && <Box sx={{
            fontSize: `.5rem`,
            bgcolor: `red`,
            color: `#fff`,
            marginLeft: `auto`,
            position: `absolute`,
            padding: `1px 4px`,
            left: `0`,
            top: `-2px`,
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
              top: `-4px`,
            }}
          >
          Added: {formatFromDateTimeToStringDate(appointment.createdDate)}
          </Typography>
    
          <Typography sx={{
            fontSize: `1rem`,
            fontWeight: `bold`,
          }}>
            {appointment.date} {appointment.timeStart} - {appointment.timeEnd}
          </Typography>
    
          <Typography sx={{
            fontSize: `.8rem`,
          }}>
            {appointment.service.name} {appointment.service.duration}
          </Typography>

          <Typography sx={{
            fontSize: `.8rem`,
          }}>
            {appointment.employee.firstName} {appointment.employee.lastName}
          </Typography>
        </Box>
      ))}
    </Box>}
  </>
  );
}
