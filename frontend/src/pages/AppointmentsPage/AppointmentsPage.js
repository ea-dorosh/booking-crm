/* eslint-disable no-unused-vars */
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import AppointmentsContainer from "@/components/AppointmentsContainer/AppointmentsContainer";
import PageContainer from '@/components/PageContainer/PageContainer';
import { 
  fetchAppointments,
  setSortingRule,
} from '@/features/appointments/appointmentsSlice';


export default function AppointmentsPage() {
  const dispatch = useDispatch();
  const { data: appointments, sortingRule, direction } = useSelector((state) => state.appointments);

  useEffect(() => {
    dispatch(fetchAppointments());
  }, []);

  const handleSortChange = (rule) => {
    const newDirection = sortingRule === rule && direction === `des` ? `asc` : `des`;
    dispatch(setSortingRule({ rule, direction: newDirection }));
  };

  return (
    <PageContainer pageTitle="Appointments">

      <button onClick={() => handleSortChange('date')}>Sort by Date</button>
      <button onClick={() => handleSortChange('createdDate')}>Sort by Created Date</button>
      
      <AppointmentsContainer
        appointments={appointments}
      />
    </PageContainer>
  );
}
