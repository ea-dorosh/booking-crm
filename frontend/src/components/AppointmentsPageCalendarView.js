import deLocale from '@fullcalendar/core/locales/de';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Settings as SettingsIcon } from '@mui/icons-material';
import {
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppointmentEventMenu from '@/components/AppointmentEventMenu';
import { fetchAppointments, setCalendarState, setStartDate } from '@/features/appointments/appointmentsSlice';

export default function AppointmentsPageCalendarView({ appointments = [] }) {
  const dispatch = useDispatch();
  const calendar = useSelector((state) => state.appointments.calendar);
  const currentStartDate = useSelector((state) => state.appointments.startDate);
  const [view, setView] = React.useState(calendar?.view || `timeGridDay`); // timeGridDay | timeGridThreeDay | timeGridWeek
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openSettings = Boolean(anchorEl);
  const [eventAnchor, setEventAnchor] = React.useState(null);
  const [selectedAppt, setSelectedAppt] = React.useState(null);

  const handleViewChange = (_e, newView) => {
    if (!newView) return;
    setView(newView);
    dispatch(setCalendarState({ view: newView }));
  };

  const calendarRef = React.useRef(null);

  React.useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(view);
      const startIso = api.view?.currentStart?.toISOString()?.slice(0,10);
      const endIso = api.view?.currentEnd?.toISOString()?.slice(0,10);
      if (startIso && (startIso !== currentStartDate || endIso !== calendar?.endDate)) {
        dispatch(setStartDate({ startDate: startIso }));
        dispatch(setCalendarState({ endDate: endIso }));
        dispatch(fetchAppointments());
      }
    }
  }, [view]);

  const events = appointments?.map((a) => ({
    id: String(a.id),
    title: a.serviceName,
    start: a.timeStart,
    end: a.timeEnd,
    extendedProps: {
      appointment: a,
      employeeId: a.employee?.id || null,
    },
  })) || [];

  // Touch swipe navigation
  const touchStart = React.useRef({
    x: 0,
    y: 0,
    t: 0,
  });
  const handleTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStart.current = {
      x: t.clientX,
      y: t.clientY,
      t: Date.now(),
    };
  };
  const handleTouchEnd = (e) => {
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.t;
    // Horizontal swipe with minimal vertical movement
    if (Math.abs(dx) > 50 && Math.abs(dy) < 60 && dt < 800) {
      const api = calendarRef.current?.getApi();
      if (!api) return;
      if (dx < 0) api.next(); else api.prev();
      const startIso = api.view?.currentStart?.toISOString()?.slice(0,10);
      const endIso = api.view?.currentEnd?.toISOString()?.slice(0,10);
      if (startIso) dispatch(setStartDate({ startDate: startIso }));
      dispatch(setCalendarState({ endDate: endIso }));
      dispatch(fetchAppointments());
    }
  };

  return (
    <Box sx={{ mt: 1.5 }}>
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
        sx={{ mb: 2 }}
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
            onClick={() => {
              const api = calendarRef.current?.getApi();
              if (!api) return;
              api.today();
              const startIso = api.view?.currentStart?.toISOString()?.slice(0,10);
              const endIso = api.view?.currentEnd?.toISOString()?.slice(0,10);
              if (startIso) dispatch(setStartDate({ startDate: startIso }));
              dispatch(setCalendarState({ endDate: endIso }));
              dispatch(fetchAppointments());
            }}
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



          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            ml: { sm: `auto` },
            justifyContent: `space-between`,
          }}
        >
          <ToggleButton
            value="prev"
            onClick={() => {
              const api = calendarRef.current?.getApi();
              if (!api) return;
              api.prev();
              const startIso = api.view?.currentStart?.toISOString()?.slice(0,10);
              const endIso = api.view?.currentEnd?.toISOString()?.slice(0,10);
              if (startIso) dispatch(setStartDate({ startDate: startIso }));
              dispatch(setCalendarState({ endDate: endIso }));
              dispatch(fetchAppointments());
            }}
            size="small"
          >
            ◀
          </ToggleButton>

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

          <ToggleButton
            value="next"
            onClick={() => {
              const api = calendarRef.current?.getApi();
              if (!api) return;
              api.next();
              const startIso = api.view?.currentStart?.toISOString()?.slice(0,10);
              const endIso = api.view?.currentEnd?.toISOString()?.slice(0,10);
              if (startIso) dispatch(setStartDate({ startDate: startIso }));
              dispatch(setCalendarState({ endDate: endIso }));
              dispatch(fetchAppointments());
            }}
            size="small"
          >
            ▶
          </ToggleButton>
        </Stack>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={openSettings}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem disabled>Time range</MenuItem>
        <MenuItem onClick={() => { dispatch(setCalendarState({ minHour: 8 })); setAnchorEl(null); }}>Start: 08:00</MenuItem>
        <MenuItem onClick={() => { dispatch(setCalendarState({ minHour: 9 })); setAnchorEl(null); }}>Start: 09:00</MenuItem>
        <MenuItem onClick={() => { dispatch(setCalendarState({ minHour: 10 })); setAnchorEl(null); }}>Start: 10:00</MenuItem>
        <MenuItem divider />
        <MenuItem onClick={() => { dispatch(setCalendarState({ maxHour: 18 })); setAnchorEl(null); }}>End: 18:00</MenuItem>
        <MenuItem onClick={() => { dispatch(setCalendarState({ maxHour: 20 })); setAnchorEl(null); }}>End: 20:00</MenuItem>
        <MenuItem onClick={() => { dispatch(setCalendarState({ maxHour: 22 })); setAnchorEl(null); }}>End: 22:00</MenuItem>
        <MenuItem divider />
        <FormControlLabel
          sx={{
            pl: 1,
            pr: 2,
          }}
          control={
            (
              <Checkbox
                checked={Boolean(calendar?.showSunday)}
                onChange={(e) => dispatch(setCalendarState({ showSunday: e.target.checked }))}
                size="small"
              />
            )
          }
          label="Show Sunday in week view"
        />
      </Menu>

      <Box
        sx={{
          height: {
            xs: `calc(100vh - 216px)`,
          },
          overflowY: `auto`,
          WebkitOverflowScrolling: `touch`,
          overscrollBehavior: `contain`,
          touchAction: `pan-y`,
          mx: {
            xs: -2,
            sm: -3,
          },
          px: {
            xs: 0,
            sm: 1,
          },
          '& .fc': {
            fontSize: `0.9rem`,
            // Remove yellow today background
            '--fc-today-bg-color': `transparent`,
          },
          '& .fc .fc-timegrid-slot, & .fc .fc-timegrid-slot-label, & .fc .fc-timegrid-slot-lane': {
            height: `28px !important`,
            lineHeight: `28px !important`,
          },
          // Modern look: lighter borders, subtle backgrounds
          '& .fc-theme-standard .fc-scrollgrid': { border: `none` },
          '& .fc-theme-standard td, & .fc-theme-standard th': { borderColor: `rgba(0,0,0,0.06)` },
          '& .fc-col-header, & .fc-theme-standard th': { backgroundColor: `rgba(0,0,0,0.02)` },
          '& .fc-timegrid-slot': { backgroundColor: `rgba(0,0,0,0.01)` },
          '& .fc-timegrid-axis': {
            backgroundColor: `transparent`,
            borderRight: `1px solid rgba(0,0,0,0.08)`,
          },
          '& .fc-timegrid-slot-label-cushion': {
            color: `rgba(0,0,0,0.68)`,
            fontWeight: 500,
          },
          '& .fc .fc-timegrid-event .fc-event-main-frame': {
            display: `flex`,
            flexDirection: `column`,
            minWidth: 0,
          },
          '& .fc .fc-timegrid-event .fc-event-main, & .fc .fc-timegrid-event .fc-event-title': {
            whiteSpace: `normal`,
            overflowWrap: `anywhere`,
            wordBreak: `break-word`,
            hyphens: `auto`,
            lineHeight: 1.2,
          },
          '& .fc .fc-timegrid-event .fc-event-main, & .fc .fc-timegrid-event .fc-event-time': {
            whiteSpace: `normal`,
            overflowWrap: `anywhere`,
            wordBreak: `break-word`,
            hyphens: `auto`,
            lineHeight: 1.2,
          },
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          locales={[deLocale]}
          locale="de"
          initialView="timeGridDay"
          firstDay={1}
          views={{
            timeGridDay: {
              dayHeaderContent: (arg) => getDayHeaderText(arg.date, `long`),
            },
            timeGridThreeDay: {
              type: `timeGrid`,
              duration: { days: 3 },
              dayHeaderContent: (arg) => getDayHeaderText(arg.date, `short`),
            },
            timeGridWeek: {
              // Align to week boundaries (Mon as firstDay)
              hiddenDays: calendar?.showSunday ? [] : [0],
              dayHeaderContent: (arg) => getDayHeaderText(arg.date, `short`),
            },
          }}
          headerToolbar={false}
          allDaySlot={false}
          slotDuration="00:30:00"
          slotMinTime={`${String(calendar?.minHour || 9).padStart(2, `0`)}:00:00`}
          slotMaxTime={`${String(calendar?.maxHour || 20).padStart(2, `0`)}:00:00`}
          slotLabelInterval={{ hours: 1 }}
          slotLabelFormat={{
            hour: `2-digit`,
            hour12: false,
          }}
          nowIndicator
          height="auto"
          events={events}
          eventOverlap={false}
          slotEventOverlap={false}
          eventDidMount={(info) => {
            // Deterministic color by employee id
            const employeeId = info.event.extendedProps?.employeeId;
            const color = getEmployeeColor(employeeId);
            if (color) {
              info.el.style.backgroundColor = color.bg;
              info.el.style.borderColor = color.border;
              info.el.style.color = color.text;
              info.el.style.boxShadow = `0 2px 8px rgba(0,0,0,0.08)`;
              info.el.style.borderRadius = `6px`;
            }
          }}
          eventClick={(clickInfo) => {
            setSelectedAppt(clickInfo.event.extendedProps?.appointment || null);
            setEventAnchor(clickInfo.el);
          }}
          datesSet={(arg) => {
            const startIso = arg.start?.toISOString()?.slice(0,10);
            const endIso = arg.end?.toISOString()?.slice(0,10);
            const changed = (startIso && startIso !== currentStartDate) || (endIso !== calendar?.endDate);
            if (changed) {
              if (startIso) dispatch(setStartDate({ startDate: startIso }));
              dispatch(setCalendarState({ endDate: endIso }));
            }
          }}
        />
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
    </Box>
  );
}

// Simple deterministic color generator from numeric id
function getEmployeeColor(employeeId) {
  if (!employeeId && employeeId !== 0) return null;
  const hue = (Number(employeeId) * 47) % 360; // spread hues
  // Softer pastel palette to reduce visual aggressiveness
  const bg = `hsl(${hue} 70% 70%)`;
  const border = `hsl(${hue} 70% 70%)`;
  const text = `#2b2b2b`;
  return {
    bg,
    border,
    text,
  };
}

// Build German header text according to view:
// - short: "Fr 31.10"
// - long:  "Samstag 1.11"
function getDayHeaderText(dateLike, weekdayLength = `short`) {
  try {
    const d = new Date(dateLike.valueOf ? dateLike.valueOf() : dateLike);
    const weekday = new Intl.DateTimeFormat(`de-DE`, { weekday: weekdayLength }).format(d)
      .replace(/\.$/, ``); // remove trailing dot from short forms (Fr., So.)
    const day = String(d.getDate());
    const month = String(d.getMonth() + 1).padStart(2, `0`);
    // Use non-breaking space between weekday and date for nicer wrap
    return `${weekday} ${day}.${month}`;
  } catch {
    return ``;
  }
}


