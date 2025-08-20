/* eslint-disable no-unused-vars */
import {
  Box,
  LinearProgress,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import dayjs from 'dayjs';
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import AppointmentsContainer from "@/components/AppointmentsContainer/AppointmentsContainer";
import AppointmentsSorting from "@/components/AppointmentsSorting/AppointmentsSorting";
import AppointmentsStartDate from "@/components/AppointmentsStartDate/AppointmentsStartDate";
import AppointmentsStatus from "@/components/AppointmentsStatus/AppointmentsStatus";
import PageContainer from '@/components/PageContainer/PageContainer';
import { selectSortedAppointments } from '@/features/appointments/appointmentsSelectors';
import {
  fetchAppointments,
  resetAppointmentsData,
  setStartDate,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsPage() {
  const dispatch = useDispatch();

  const appointments = useSelector(selectSortedAppointments);
  const {
    startDate, isPending,
  } = useSelector((state) => state.appointments);

  useEffect(() => {
    if (!startDate) {
      dispatch(setStartDate({ startDate: dayjs(new Date()).format(`YYYY-MM-DD`) }));
    }

    if (!appointments || appointments.length === 0) {
      dispatch(fetchAppointments());
    }
  }, []);

  const onStartDateChange = (newStartDate) => {
    dispatch(setStartDate({ startDate: newStartDate }));
    dispatch(fetchAppointments());
  };

  return (
    <PageContainer
      pageTitle="Appointments"
      hideSideNav
    >
      <Card
        sx={{
          mt: 2,
          mb: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: `flex`,
              justifyContent: `space-between`,
              alignItems: `flex-start`,
              mb: 3,
              flexWrap: `wrap`,
              gap: 1,
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 600,
                color: `text.primary`,
                flex: 1,
                minWidth: 0,
              }}
            >
              Filter & Sort Appointments
            </Typography>

            {appointments && (
              <Chip
                label={`${appointments.length} found`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          <Stack
            direction={{
              xs: `column`,
              sm: `row`,
            }}
            spacing={2}
            alignItems={{
              xs: `stretch`,
              sm: `center`,
            }}
          >
            {startDate && (
              <AppointmentsStartDate
                startDate={startDate}
                onStartDateChange={onStartDateChange}
              />
            )}

            <AppointmentsStatus />

            <Box
              sx={{
                ml: {
                  sm: `auto`,
                },
              }}
            >
              <AppointmentsSorting />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {isPending && (
        <Box
          sx={{
            mt: 2,
            mb: 2,
          }}
        >
          <LinearProgress />
        </Box>
      )}

      {appointments && (
        <AppointmentsContainer
          appointments={appointments}
        />
      )}
    </PageContainer>
  );
}
