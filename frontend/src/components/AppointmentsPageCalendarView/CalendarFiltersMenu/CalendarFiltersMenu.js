import {
  Menu,
  Box,
  Divider,
} from "@mui/material";
import AppointmentsStatus from '@/components/AppointmentsStatus/AppointmentsStatus';
import EmployeeFilter from '@/components/EmployeeFilter/EmployeeFilter';

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
          minWidth: 220,
        }}
      >
        <AppointmentsStatus />

        <Divider sx={{ my: 2 }} />

        <EmployeeFilter />
      </Box>
    </Menu>
  );
}
