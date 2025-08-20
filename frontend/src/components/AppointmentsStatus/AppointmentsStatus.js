import {
  CheckCircle as ActiveIcon,
  Cancel as CancelIcon,
  ViewList as AllIcon,
} from '@mui/icons-material';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Stack,
} from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { appointmentStatusEnum } from '@/enums/enums';
import {
  setStatus,
  fetchAppointments,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsStatus() {
  const dispatch = useDispatch();

  const { status } = useSelector((state) => state.appointments);

  const handleStatusChange = (event, newStatus) => {
    // Allow deselection by clicking the same button
    const selectedStatus = newStatus === status ? null : newStatus;

    dispatch(setStatus({
      status: selectedStatus,
    }));

    dispatch(fetchAppointments());
  };

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mb: 1,
          display: `block`,
          fontWeight: 600,
          textTransform: `uppercase`,
          letterSpacing: `0.5px`,
        }}
      >
        Filter by Status
      </Typography>

      <ToggleButtonGroup
        value={status}
        exclusive
        onChange={handleStatusChange}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            minWidth: 80,
          },
        }}
      >
        <ToggleButton
          value={appointmentStatusEnum.active}
          sx={{
            textTransform: `none`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <ActiveIcon
              fontSize="small"
              sx={{
                color: `success.main`,
              }}
            />
            <Typography variant="body2">
              Active
            </Typography>
          </Stack>
        </ToggleButton>

        <ToggleButton
          value={appointmentStatusEnum.canceled}
          sx={{
            textTransform: `none`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <CancelIcon
              fontSize="small"
              sx={{
                color: `error.main`,
              }}
            />
            <Typography variant="body2">
              Canceled
            </Typography>
          </Stack>
        </ToggleButton>

        <ToggleButton
          value={null}
          sx={{
            textTransform: `none`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <AllIcon fontSize="small" />

            <Typography variant="body2">
              All
            </Typography>
          </Stack>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
