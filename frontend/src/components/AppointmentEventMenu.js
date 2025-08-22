import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
  Popover,
  SwipeableDrawer,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { appointmentStatusEnum } from '@/enums/enums';
import {
  formattedDateToTime,
  formatTimeToString,
  formatIsoDate,
  formatCreatedDate,
} from '@/utils/formatters';

export default function AppointmentEventMenu({
  open,
  anchorEl,
  onClose,
  appointment,
  onOpenDetails,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(`sm`));

  if (!appointment) return null;

  const content = (
    <Box
      sx={{
        p: 2,
        minWidth: {
          xs: 300,
          sm: 360,
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700 }}
        >
          {appointment.serviceName}
        </Typography>
        <Chip
          size="small"
          label={appointment.status === appointmentStatusEnum.active ? `Active` : `Canceled`}
          color={appointment.status === appointmentStatusEnum.active ? `success` : `error`}
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      <Stack spacing={1.25}>
        <Row
          label="Date"
          value={formatIsoDate(appointment.date)}
        />
        <Row
          label="Time"
          value={`${formattedDateToTime(appointment.timeStart)} - ${formattedDateToTime(appointment.timeEnd)}`}
        />
        <Row
          label="Duration"
          value={formatTimeToString(appointment.serviceDuration)}
        />
        {appointment.location &&
        <Row
          label="Location"
          value={appointment.location}
        />}
        {appointment.customer && (
          <Row
            label="Client"
            value={`${appointment.customer.lastName} ${appointment.customer.firstName}`}
          />
        )}
        {appointment.employee && (
          <Row
            label="Master"
            value={`${appointment.employee.lastName} ${appointment.employee.firstName}`}
          />
        )}
        <Row
          label="Created"
          value={formatCreatedDate(appointment.createdDate)}
        />
      </Stack>

      <Stack
        direction={{
          xs: `column`,
          sm: `row`,
        }}
        spacing={1.5}
        sx={{ mt: 2 }}
      >
        <Button
          variant="contained"
          onClick={onOpenDetails}
          fullWidth
        >
          Open detail
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          fullWidth
        >
          Close
        </Button>
      </Stack>
    </Box>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onOpen={() => {}}
        onClose={onClose}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          },
        }}
      >
        {content}
      </SwipeableDrawer>
    );
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: `bottom`,
        horizontal: `left`,
      }}
      transformOrigin={{
        vertical: `top`,
        horizontal: `left`,
      }}
    >
      {content}
    </Popover>
  );
}

function Row({
  label, value,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="baseline"
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          minWidth: 72,
          textTransform: `uppercase`,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 500 }}
      >
        {value}
      </Typography>
    </Stack>
  );
}


