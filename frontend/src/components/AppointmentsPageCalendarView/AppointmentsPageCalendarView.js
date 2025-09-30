import { Settings as SettingsIcon, FilterList as FilterIcon } from '@mui/icons-material';
import {
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  IconButton,
} from "@mui/material";
import {
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import CalendarFiltersMenu from './CalendarFiltersMenu/CalendarFiltersMenu';
import CalendarMenu from './CalendarMenu/CalendarMenu';
import InfiniteScrollCalendar from './InfiniteScrollCalendar/InfiniteScrollCalendar';
import ActiveFiltersIndicator from '@/components/ActiveFiltersIndicator/ActiveFiltersIndicator';
import AppointmentEventMenu from '@/components/AppointmentEventMenu/AppointmentEventMenu';
import {
  fetchAppointments,
  setCalendarState,
  setStartDate,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsPageCalendarView({ appointments = [] }) {
  const dispatch = useDispatch();

  const calendar = useSelector((state) => state.appointments.calendar);
  const [view, setView] = useState(calendar?.view || `timeGridDay`); // timeGridDay | timeGridThreeDay | timeGridWeek
  const [anchorEl, setAnchorEl] = useState(null);
  const openSettings = Boolean(anchorEl);
  const [filtersAnchorEl, setFiltersAnchorEl] = useState(null);
  const openFilters = Boolean(filtersAnchorEl);
  const [eventAnchor, setEventAnchor] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const todayRef = useRef(null);

  const handleViewChange = (_event, newView) => {
    if (!newView) return;
    setView(newView);
    dispatch(setCalendarState({ view: newView }));
  };

  // Map view to visible days count
  const getVisibleDaysCount = () => {
    switch (view) {
    case `timeGridDay`: return 1;
    case `timeGridThreeDay`: return 3;
    case `timeGridWeek`: return calendar?.showSunday ? 7 : 6;
    default: return 1;
    }
  };

  // Handle date range change from infinite scroll calendar
  const handleDateRangeChange = useCallback((startDate, endDate) => {
    const startIso = startDate.toISOString().slice(0, 10);
    const endIso = endDate.toISOString().slice(0, 10);

    dispatch(setStartDate({ startDate: startIso }));
    dispatch(setCalendarState({ endDate: endIso }));
    dispatch(fetchAppointments());
  }, [dispatch]);

  // Handle "Today" button click
  const handleTodayClick = useCallback(() => {
    // Use the calendar's scrollToToday function if available
    if (todayRef.current) {
      todayRef.current();
    } else {
      // Fallback to original logic
      const today = new Date();
      const startIso = today.toISOString().slice(0, 10);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + getVisibleDaysCount());
      const endIso = endDate.toISOString().slice(0, 10);

      dispatch(setStartDate({ startDate: startIso }));
      dispatch(setCalendarState({ endDate: endIso }));
      dispatch(fetchAppointments());
    }
  }, [dispatch, getVisibleDaysCount]);

  // Handle event click
  const handleEventClick = useCallback((appointment, anchorElement) => {
    setSelectedAppt(appointment);
    setEventAnchor(anchorElement);
  }, []);

  return (
    <Box sx={{ mt: `6px` }}>
      <Stack
        direction={{
          xs: `column`,
          sm: `row`,
        }}
        spacing={2}
        alignItems={{
          xs: `stretch`,
          sm: `center`,
        }}
        sx={{ mb: `4px` }}
      >
        <Box
          sx={{
            display: `flex`,
            alignItems: `flex-start`,
            justifyContent: `space-between`,
          }}
        >
          <Button
            size="small"
            variant='outlined'
            color='secondary'
            onClick={handleTodayClick}
            sx={{
              fontSize: `0.8rem`,
              fontWeight: 600,
              textTransform: `none`,
              padding: `4px 12px`,
              borderRadius: `4px`,
              lineHeight: 1.2,
            }}
          >
            Today
          </Button>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
          >
            <CalendarMenu
              anchorEl={anchorEl}
              open={openSettings}
              onClose={() => setAnchorEl(null)}
            />

            <CalendarFiltersMenu
              anchorEl={filtersAnchorEl}
              open={openFilters}
              onClose={() => setFiltersAnchorEl(null)}
            />

            <IconButton
              size="small"
              onClick={(event) => setFiltersAnchorEl(event.currentTarget)}
              sx={{
                color: openFilters ? `primary.main` : `inherit`,
              }}
            >
              <FilterIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={(event) => setAnchorEl(event.currentTarget)}
              sx={{
                color: openSettings ? `primary.main` : `inherit`,
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            ml: { sm: `auto` },
            justifyContent: `center`,
            mt: `6px !important`,
          }}
        >
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
            sx={{
              mt: {
                xs: 1,
                sm: 0,
              },
            }}
          >
            <ToggleButton value="timeGridDay">1 day</ToggleButton>
            <ToggleButton value="timeGridThreeDay">3 days</ToggleButton>
            <ToggleButton value="timeGridWeek">Week</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box
          sx={{
            mt: `6px !important`,
          }}
        >
          <ActiveFiltersIndicator />
        </Box>
      </Stack>


      <Box
        sx={{
          marginLeft: `-12px`,
          marginRight: `-12px`,
        }}
      >

        <InfiniteScrollCalendar
          appointments={appointments}
          onDateRangeChange={handleDateRangeChange}
          minHour={calendar?.minHour || 9}
          maxHour={calendar?.maxHour || 20}
          visibleDays={getVisibleDaysCount()}
          onEventClick={handleEventClick}
          onTodayRef={todayRef}
        />
      </Box>

      <AppointmentEventMenu
        open={Boolean(selectedAppt)}
        anchorEl={eventAnchor}
        onClose={() => { setSelectedAppt(null); setEventAnchor(null); }}
        appointment={selectedAppt}
        onOpenDetails={() => {
          if (selectedAppt?.id) {
            window.location.href = `/appointments/${selectedAppt.id}`;
          }
        }}
      />
    </Box>
  );
}


