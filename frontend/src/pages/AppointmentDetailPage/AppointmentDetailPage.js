import { 
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { useParams } from "react-router-dom";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import { appointmentStatusEnum } from '@/enums/enums';
import {
  fetchAppointment,
  clearAppointment,
} from '@/features/appointments/appointmentSlice';
import { 
  formattedTime,
  formatCreatedDate,
  formatTimeToString,
  formatIsoDate,
} from '@/utils/formatters';

export default function AppointmentDetailPage() {
  const dispatch = useDispatch();

  const { appointmentId } = useParams();
  
  const {data: appointment, isPending} = useSelector(state => state.appointment);  

  useEffect(() => {
    dispatch(fetchAppointment(appointmentId));

    return () => {
      dispatch(clearAppointment());
    };
  }, []);

  return (
    <PageContainer 
      pageTitle="Appointment Detail"
      hideSideNav
    >
      <GoBackNavigation />

      {isPending && <LinearProgress />}

      {appointment && <Box mt={3}
        sx={{
          display: `flex`,
          flexDirection: `column`,
        }}
      >
        <Box sx={{
          display: `flex`,
          flexDirection: `column`,
        }}>
          <Typography
            variant="h4"
            bold
            sx={{
              fontSize: `1.5rem`,
            }}
          >
            {appointment.serviceName}
          </Typography>

          <Box sx={{
            display: `flex`,
            alignItems: `center`,
            gap: `10px`,
            mt: `1rem`,
          }}>
            <Typography
              variant="subtitle1"
            >
              Date: {formatIsoDate(appointment.date)}
            </Typography>

            {appointment.status === appointmentStatusEnum.active && <Box sx={{
              backgroundColor: `green`,
              color: `#fff`,
              padding: `4px 10px`,
              borderRadius: `3px`,
              fontSize: `.8rem`,
              ml: `auto`,
            }}>
              Active
            </Box>}
          </Box>

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
              Client: 
            </Typography>

            <Typography
              component={RouterLink}
              to={`/employees/${appointment.employee.id}`}
              variant="subtitle1"
              sx={{
                color: `#1976d2`,
                textDecoration: `none`,
              }}
            >
              {appointment.customer.lastName} {appointment.customer.firstName}
            </Typography>

            {appointment.customer.isCustomerNew && <Box sx={{
              backgroundColor: `green`,
              color: `#fff`,
              padding: `3px 6px`,
              borderRadius: `3px`,
              fontSize: `.7rem`,
            }}>
              New Client
            </Box>}
          </Box>

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
              sx={{
                color: `#1976d2`,
                textDecoration: `none`,
              }}
            >
              {appointment.employee.lastName} {appointment.employee.firstName}
            </Typography>
          </Box>
        </Box>
      </Box>}
    </PageContainer>
  );
}
