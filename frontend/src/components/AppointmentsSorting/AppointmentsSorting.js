import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Stack,
} from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import {
  APPOINTMENTS_SORT_RULE,
  SORT_DIRECTION,
} from '@/constants/sorting';
import {
  setSortingRule,
  fetchAppointments,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsSorting() {
  const dispatch = useDispatch();

  const {
    sortRule, sortDirection,
  } = useSelector((state) => state.appointments);

  const handleSortChange = (event, newSortRule) => {
    let newSortDirection;
    let ruleToSet;

    if (newSortRule === null) {
      // Clicking on already selected button - toggle direction
      newSortDirection = sortDirection === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
      ruleToSet = sortRule; // Keep the same rule
    } else {
      // Clicking on different button - start with DESC
      newSortDirection = SORT_DIRECTION.DESC;
      ruleToSet = newSortRule;
    }

    dispatch(setSortingRule({
      sortRule: ruleToSet,
      sortDirection: newSortDirection,
    }));

    dispatch(fetchAppointments());
  };

  const getSortIcon = (rule) => {
    const isActive = sortRule === rule;
    const IconComponent = sortDirection === SORT_DIRECTION.ASC ? ArrowUpward : ArrowDownward;

    return (
      <IconComponent
        fontSize="small"
        sx={{
          opacity: isActive ? 1 : 0,
          transition: `opacity 0.2s ease-in-out`,
        }}
      />
    );
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
        Sort by
      </Typography>

      <ToggleButtonGroup
        value={sortRule}
        exclusive
        onChange={handleSortChange}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            minWidth: 100,
          },
        }}
      >
        <ToggleButton
          value={APPOINTMENTS_SORT_RULE.DATE}
          sx={{
            textTransform: `none`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <CalendarIcon fontSize="small" />
            <Typography variant="body2">
              Date
            </Typography>
            {getSortIcon(APPOINTMENTS_SORT_RULE.DATE)}
          </Stack>
        </ToggleButton>

        <ToggleButton
          value={APPOINTMENTS_SORT_RULE.CREATED_DATE}
          sx={{
            textTransform: `none`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <TimeIcon fontSize="small" />
            <Typography variant="body2">
              Created
            </Typography>
            {getSortIcon(APPOINTMENTS_SORT_RULE.CREATED_DATE)}
          </Stack>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
