import {
  Menu,
  Box,
} from "@mui/material";
import AppointmentsStatus from '@/components/AppointmentsStatus/AppointmentsStatus';

export default function CalendarFiltersMenu({
  anchorEl,
  open,
  onClose,
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
    >
      <Box
        sx={{
          p: 2,
          minWidth: 200,
        }}
      >
        <AppointmentsStatus />
      </Box>
    </Menu>
  );
}
