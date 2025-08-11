import { 
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { appointmentStatusEnum } from '@/enums/enums';
import { 
  setStatus,
  fetchAppointments,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsStatus() {
  const dispatch = useDispatch();

  const [menuEl, setMenuEl] = useState(null);
  const isMenuOpen = Boolean(menuEl);

  const { status } = useSelector((state) => state.appointments);

  const handleMenuClick = (event) => {
    setMenuEl(event.currentTarget);
  };

  const handleClose = () => {
    setMenuEl(null);
  };

  const updateStatus = (newStatus) => {
    dispatch(setStatus({
      status: newStatus,
    }));

    dispatch(fetchAppointments());

    handleClose();
  };

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={handleMenuClick}
      >
        Status
      </Button>

      <Menu
        anchorEl={menuEl}
        open={isMenuOpen}
        onClose={handleClose}
        sx={{
          '& .MuiList-root': {
            padding: 0,
          },
        }}
      >
        <MenuItem 
          onClick={() => updateStatus(appointmentStatusEnum.active)}
          sx={{
            backgroundColor: status === appointmentStatusEnum.active ? `lightgrey` : `initial`,              
          }}
        >
          <Typography
          >
            Active
          </Typography>
        </MenuItem>

        <MenuItem 
          onClick={() => updateStatus(appointmentStatusEnum.canceled)}
          sx={{
            backgroundColor: status === appointmentStatusEnum.canceled ? `lightgrey` : `initial`,              
          }}
        >
          <Typography
          >
            Canceled
          </Typography>
        </MenuItem>

        <MenuItem 
          onClick={() => updateStatus(null)}
          sx={{
            backgroundColor: status === null ? `lightgrey` : `initial`,              
          }}
        >
          <Typography
          >
            All
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
