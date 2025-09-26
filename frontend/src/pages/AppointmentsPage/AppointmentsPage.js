import dayjs from 'dayjs';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import AppointmentsPageCalendarView from '@/components/AppointmentsPageCalendarView/AppointmentsPageCalendarView';
import AppointmentsPageListView from '@/components/AppointmentsPageListView/AppointmentsPageListView';
import PageContainer from '@/components/PageContainer/PageContainer';
import Tabs from '@/components/Tabs/Tabs';
import { selectSortedAppointments } from '@/features/appointments/appointmentsSelectors';
import {
  fetchAppointments,
  setStartDate,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsPage() {
  const dispatch = useDispatch();
  const appointments = useSelector(selectSortedAppointments);
  const {
    startDate,
    isPending,
  } = useSelector((state) => state.appointments);

  // Tabs state with session persistence
  const STORAGE_KEY = `appointmentsActiveTab`;
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || `list`;
    } catch (e) {
      return `list`;
    }
  });

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    try {
      sessionStorage.setItem(STORAGE_KEY, newValue);
    } catch (e) {
      // ignore
    }
    // Trigger fresh fetch to respect list vs calendar params (endDate)
    dispatch(fetchAppointments());
  };

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

  const tabs = [
    {
      label: `List`,
      value: `list`,
    },
    {
      label: `Calendar`,
      value: `calendar`,
    },
  ];

  return (
    <PageContainer
      pageTitle="Appointments"
      hideSideNav
    >
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {activeTab === `list` ? (
        <AppointmentsPageListView
          appointments={appointments}
          startDate={startDate}
          isPending={isPending}
          onStartDateChange={onStartDateChange}
        />
      ) : (
        <AppointmentsPageCalendarView
          appointments={appointments}
          startDate={startDate}
        />
      )}
    </PageContainer>
  );
}
