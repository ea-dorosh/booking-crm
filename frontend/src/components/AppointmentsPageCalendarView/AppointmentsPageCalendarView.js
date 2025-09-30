import deLocale from '@fullcalendar/core/locales/de';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
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
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import CalendarFiltersMenu from './CalendarFiltersMenu/CalendarFiltersMenu';
import CalendarMenu from './CalendarMenu/CalendarMenu';
import ActiveFiltersIndicator from '@/components/ActiveFiltersIndicator/ActiveFiltersIndicator';
import AppointmentEventMenu from '@/components/AppointmentEventMenu/AppointmentEventMenu';
import { appointmentStatusEnum } from '@/enums/enums';
import {
  fetchAppointments,
  setCalendarState,
  setStartDate,
} from '@/features/appointments/appointmentsSlice';

export default function AppointmentsPageCalendarView({ appointments = [] }) {
  const dispatch = useDispatch();
  const calendarRef = useRef(null);

  const calendar = useSelector((state) => state.appointments.calendar);
  const currentStartDate = useSelector((state) => state.appointments.startDate);
  const [view, setView] = useState(calendar?.view || `timeGridDay`); // timeGridDay | timeGridThreeDay | timeGridWeek
  const [anchorEl, setAnchorEl] = useState(null);
  const openSettings = Boolean(anchorEl);
  const [filtersAnchorEl, setFiltersAnchorEl] = useState(null);
  const openFilters = Boolean(filtersAnchorEl);
  const [eventAnchor, setEventAnchor] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const handleViewChange = (_event, newView) => {
    if (!newView) return;
    setView(newView);
    dispatch(setCalendarState({ view: newView }));
  };

  useEffect(() => {
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

  const events = appointments?.map((appointment) => ({
    id: String(appointment.id || `google-${appointment.googleEventId}`),
    title: appointment.isGoogleEvent ? `📅 ${appointment.serviceName}` : appointment.serviceName,
    start: appointment.timeStart,
    end: appointment.timeEnd,
    extendedProps: {
      appointment: appointment.isGoogleEvent ? null : appointment,
      employeeId: appointment.employee?.id || null,
      status: appointment.status,
      isGoogleEvent: appointment.isGoogleEvent || false,
      googleEventId: appointment.googleEventId,
    },
  })) || [];

  // Touch swipe navigation
  const touchStart = useRef({
    x: 0,
    y: 0,
    t: 0,
  });
  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      t: Date.now(),
    };
  };
  const handleTouchEnd = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.t;
    // Horizontal swipe with minimal vertical movement
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 60 && deltaTime < 800) {
      const api = calendarRef.current?.getApi();
      if (!api) return;
      if (deltaX < 0) api.next(); else api.prev();
      const startIso = api.view?.currentStart?.toISOString()?.slice(0,10);
      const endIso = api.view?.currentEnd?.toISOString()?.slice(0,10);
      if (startIso) dispatch(setStartDate({ startDate: startIso }));
      dispatch(setCalendarState({ endDate: endIso }));
      dispatch(fetchAppointments());
    }
  };

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
            justifyContent: `space-between`,
            mt: `6px !important`,
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
          // Highlight today's column header
          '& .fc-day-today.fc-col-header-cell': {
            backgroundColor: `rgba(25, 118, 210, 0.08)`,
            borderBottom: `3px solid #1976d2`,
          },
          '& .fc-day-today.fc-col-header-cell .fc-col-header-cell-cushion': {
            color: `#1976d2`,
            fontWeight: 700,
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
            const isGoogleEvent = info.event.extendedProps?.isGoogleEvent;
            const employeeId = info.event.extendedProps?.employeeId;
            const status = info.event.extendedProps?.status;
            const isCanceled = status === appointmentStatusEnum.canceled;

            // Apply Google Calendar event styling
            if (isGoogleEvent) {
              info.el.style.backgroundColor = `#4285f4`;
              info.el.style.borderColor = `#1a73e8`;
              info.el.style.color = `white`;
              info.el.style.borderRadius = `8px`;
              info.el.style.border = `2px solid #1a73e8`;
              info.el.style.boxShadow = `0 2px 6px rgba(66, 133, 244, 0.3)`;
              info.el.style.fontStyle = `italic`;
              info.el.style.opacity = `0.85`;

              // Add Google Calendar indicator
              const titleElement = info.el.querySelector(`.fc-event-title`);
              if (titleElement) {
                titleElement.style.fontWeight = `500`;
              }
            } else {
              // Regular appointment styling
              const color = getEmployeeColor(employeeId);
              if (color) {
                info.el.style.backgroundColor = color.bg;
                info.el.style.borderColor = color.border;
                info.el.style.color = color.text;
                info.el.style.borderRadius = `6px`;
              }

              // Apply canceled styling
              if (isCanceled) {
                info.el.style.opacity = `0.7`;
                info.el.style.borderColor = `#f44336`;
                info.el.style.color = `#d32f2f`;

                // Add "CANCELED" text to the event
                const titleElement = info.el.querySelector(`.fc-event-title`);
                if (titleElement) {
                  const originalTitle = titleElement.textContent;
                  titleElement.innerHTML = `${originalTitle}<br><span style="font-size: 0.7em; font-weight: bold; color: #d32f2f;">CANCELED</span>`;
                }
              }
            }
          }}
          eventClick={(clickInfo) => {
            // Only handle clicks on appointment events, not Google Calendar events
            if (!clickInfo.event.extendedProps?.isGoogleEvent) {
              setSelectedAppt(clickInfo.event.extendedProps?.appointment || null);
              setEventAnchor(clickInfo.el);
            }
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
    const date = new Date(dateLike.valueOf ? dateLike.valueOf() : dateLike);
    const weekday = new Intl.DateTimeFormat(`de-DE`, { weekday: weekdayLength }).format(date)
      .replace(/\.$/, ``); // remove trailing dot from short forms (Fr., So.)
    const day = String(date.getDate());
    const month = String(date.getMonth() + 1).padStart(2, `0`);
    // Use non-breaking space between weekday and date for nicer wrap
    return `${weekday} ${day}.${month}`;
  } catch {
    return ``;
  }
}


