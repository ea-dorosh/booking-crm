import { 
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { useParams, useNavigate } from "react-router-dom";
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  fetchAppointment,
} from '@/features/appointments/appointmentSlice';
import { 
  formattedTime,
  formatCreatedDate,
  formatTimeToString,
  formatIsoDate,
} from '@/utils/formatters';

export default function AppointmentDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { appointmentId } = useParams();
  
  const appointment = useSelector(state => state.appointment.data);  

  useEffect(() => {
    dispatch(fetchAppointment(appointmentId));
  }, []);

  return (
    <PageContainer 
      pageTitle="Appointment Detail"
      hideSideNav
    >
      <Typography
        onClick={() => navigate(-1)}
      >
        Go back
      </Typography>

      <Divider />

      {appointment && <Box mt={3}
        sx={{
          display: `flex`,
          flexDirection: `column`,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            bold
            sx={{
              fontSize: `1.5rem`,
            }}
          >
            {appointment.serviceName}
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{
              mt: `1.5rem`,
            }}
          >
            Date: {formatIsoDate(appointment.date)}
          </Typography>

          <Typography
            variant="subtitle1"
            mt={1}
          >
            Time: {formattedTime(appointment.timeStart)} - {formattedTime(appointment.timeEnd)}       ({formatTimeToString(appointment.serviceDuration)})
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{
              display: `flex`,
              alignItems: `center`,
              mt: `1rem`,
            }}
          >
            Was created: 
            
            <Box>
              <Typography
                sx={{
                  color: `green`,
                  ml: `1rem`,
                }}
              >
                {formatCreatedDate(appointment.createdDate)}
              </Typography>   

              <Typography
                sx={{
                  ml: `1rem`,
                }}
              >
                {appointment.createdDate}
              </Typography>
            </Box>   
          </Typography>

          <Typography
            variant="subtitle1"
            mt={1}
          >
            Client: {appointment.customerLastName} {appointment.customerFirstName}
          </Typography>

          <Box
            sx={{
              display: `flex`,
              alignItems: `center`,
              gap: `10px`,
              mt: `20px`,
            }}
          >
            <Typography
              variant="subtitle1"
            >
            Master:
            </Typography>

            <Typography
              component={RouterLink}
              to={`/employees/${appointment.employee.id}`}
              variant="subtitle1"
            >
              {appointment.employee.lastName} {appointment.employee.firstName}
            </Typography>
          </Box>
        </Box>
      </Box>}
    </PageContainer>
  );
}
