import {
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { setCalendarState } from '@/features/appointments/appointmentsSlice';

export default function CalendarMenu({
  anchorEl,
  open,
  onClose,
}) {
  const dispatch = useDispatch();
  const calendar = useSelector((state) => state.appointments.calendar);

  const handleMinHourChange = (minHour) => {
    dispatch(setCalendarState({ minHour }));
    onClose();
  };

  const handleMaxHourChange = (maxHour) => {
    dispatch(setCalendarState({ maxHour }));
    onClose();
  };

  const handleShowSundayChange = (event) => {
    dispatch(setCalendarState({
      showSunday: event.target.checked,
    }));
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
    >
      <MenuItem
        disabled
        sx={{
          px: 2,
          justifyContent: `center`,
          opacity: `1 !important`,
          p: `2px 0 !important`,
          minHeight: `0`,
          fontWeight: 600,
        }}
      >
        Time range
      </MenuItem>

      <MenuItem onClick={() => handleMinHourChange(8)}>Start: 08:00</MenuItem>
      <MenuItem onClick={() => handleMinHourChange(9)}>Start: 09:00</MenuItem>
      <MenuItem
        onClick={() => handleMinHourChange(10)}
        sx={{ borderBottom: `1px solid rgba(0,0,0,0.08)` }}
      >
        Start: 10:00
      </MenuItem>
      <MenuItem onClick={() => handleMaxHourChange(18)}>End: 18:00</MenuItem>
      <MenuItem onClick={() => handleMaxHourChange(20)}>End: 20:00</MenuItem>
      <MenuItem
        onClick={() => handleMaxHourChange(22)}
        sx={{ borderBottom: `1px solid rgba(0,0,0,0.08)` }}
      >
        End: 22:00
      </MenuItem>

      <MenuItem>
        <FormControlLabel
          sx={{
            pl: 0,
            pr: 0,
          }}
          control={
            (
              <Checkbox
                checked={Boolean(calendar?.showSunday)}
                onChange={handleShowSundayChange}
                size="small"
              />
            )
          }
          label="Show Sunday in week view"
        />
      </MenuItem>
    </Menu>
  );
}
