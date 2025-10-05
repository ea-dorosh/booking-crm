import { useDispatch, useSelector } from 'react-redux';
import CalendarSettingsMenu from '@/components/CalendarSettingsMenu/CalendarSettingsMenu';
import { setCalendarState } from '@/features/appointments/appointmentsSlice';

export default function CalendarMenu({
  anchorEl,
  open,
  onClose,
}) {
  const dispatch = useDispatch();
  const calendar = useSelector((state) => state.appointments.calendar);

  const handleSettingsChange = (newSettings) => {
    dispatch(setCalendarState(newSettings));
  };

  return (
    <CalendarSettingsMenu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      settings={calendar}
      onSettingsChange={handleSettingsChange}
    />
  );
}
