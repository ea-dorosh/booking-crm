/* eslint-disable no-unused-vars */
import {
  Box,
  LinearProgress,
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
  const { startDate, isPending } = useSelector((state) => state.appointments);

  useEffect(() => {
    if (!startDate) {
      dispatch(setStartDate({ startDate: dayjs(new Date()).format(`YYYY-MM-DD`) }));
    }

    if (!appointments) {
      dispatch(resetAppointmentsData());
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

      <Box sx={{
        display: `flex`,
        alignItems: `flex-start`,
        mt: 1.5,
        gap: 2,
      }}>
        {startDate && <AppointmentsStartDate
          startDate={startDate}
          onStartDateChange={onStartDateChange}
        />}

        <AppointmentsStatus />

        <Box ml="auto">
          <AppointmentsSorting />
        </Box>
      </Box>

      {isPending && <Box mt={2}>
        <LinearProgress />
      </Box>}

      {appointments && <AppointmentsContainer
        appointments={appointments}
      />}
    </PageContainer>
  );
}
