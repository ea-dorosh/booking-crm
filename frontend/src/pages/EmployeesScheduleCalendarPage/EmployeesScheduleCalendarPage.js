import deLocale from '@fullcalendar/core/locales/de';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import {
  Settings as SettingsIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import {
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Button,
  Badge,
  SwipeableDrawer,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import CalendarFiltersMenu from '@/components/CalendarFiltersMenu/CalendarFiltersMenu';
import CalendarSettingsMenu from '@/components/CalendarSettingsMenu/CalendarSettingsMenu';
import PageContainer from '@/components/PageContainer/PageContainer';
import adminService from '@/services/employees.service';
import serviceService from '@/services/services.service';

// LocalStorage keys
const TEAM_SCHEDULE_SETTINGS_KEY = `teamScheduleCalendarSettings`;
const TEAM_SCHEDULE_FILTERS_KEY = `teamScheduleFilters`;

// Helper functions for localStorage
const saveSettingsToStorage = (settings) => {
  try {
    localStorage.setItem(TEAM_SCHEDULE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn(`Failed to save team schedule settings to localStorage:`, error);
  }
};

const loadSettingsFromStorage = () => {
  try {
    const saved = localStorage.getItem(TEAM_SCHEDULE_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn(`Failed to load team schedule settings from localStorage:`, error);
  }
  return null;
};

const saveFiltersToStorage = (filters) => {
  try {
    // Convert Sets to Arrays for JSON serialization
    const filtersToSave = {
      categories: Array.from(filters.categories),
      subCategories: Array.from(filters.subCategories),
      services: Array.from(filters.services),
      employees: Array.from(filters.employees),
    };
    localStorage.setItem(TEAM_SCHEDULE_FILTERS_KEY, JSON.stringify(filtersToSave));
  } catch (error) {
    console.warn(`Failed to save team schedule filters to localStorage:`, error);
  }
};

const loadFiltersFromStorage = () => {
  try {
    const saved = localStorage.getItem(TEAM_SCHEDULE_FILTERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert Arrays back to Sets
      return {
        categories: new Set(parsed.categories || []),
        subCategories: new Set(parsed.subCategories || []),
        services: new Set(parsed.services || []),
        employees: new Set(parsed.employees || []),
      };
    }
  } catch (error) {
    console.warn(`Failed to load team schedule filters from localStorage:`, error);
  }
  return null;
};

export default function EmployeesScheduleCalendarPage() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(`timeGridWeek`);
  const calendarRef = useRef(null);
  const lastRangeRef = useRef({
    startIso: ``,
    endIso: ``,
  });
  const [blockedTimesMap, setBlockedTimesMap] = useState(new Map()); // employeeId -> array of blocked times
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const isSettingsOpen = Boolean(settingsAnchorEl);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const isFilterOpen = Boolean(filterAnchorEl);

  // Load settings from localStorage or use defaults
  const [calendarSettings, setCalendarSettings] = useState(() => {
    const savedSettings = loadSettingsFromStorage();
    return savedSettings || {
      minHour: 10,
      maxHour: 20,
      showSunday: false,
    };
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerEmployee, setDrawerEmployee] = useState({
    id: null,
    name: ``,
  });
  const [employeeCategoryTree, setEmployeeCategoryTree] = useState([]);
  const [servicesMeta, setServicesMeta] = useState({
    categories: [],
    subCategories: [],
    services: [],
  });
  const employeeServicesMapRef = useRef(new Map());

  // Load filters from localStorage or use defaults
  const [selectedFilters, setSelectedFilters] = useState(() => {
    const savedFilters = loadFiltersFromStorage();
    return savedFilters || {
      categories: new Set(),
      subCategories: new Set(),
      services: new Set(),
      employees: new Set(),
    };
  });

  const [expandedSections, setExpandedSections] = useState({
    services: false,
    employees: false,
  });
  const [lastWorkingData, setLastWorkingData] = useState([]);
  const [employeeNameMap, setEmployeeNameMap] = useState(new Map());

  const getRange = () => {
    const api = calendarRef.current?.getApi();
    const startIso = api?.view?.currentStart?.toISOString()?.slice(0, 10);
    const endIso = api?.view?.currentEnd?.toISOString()?.slice(0, 10);
    return {
      startIso,
      endIso,
    };
  };

  const fetchWorkingTimes = async () => {
    const {
      startIso,
      endIso,
    } = getRange();

    if (!startIso || !endIso) return;

    if (lastRangeRef.current.startIso === startIso && lastRangeRef.current.endIso === endIso) {
      return;
    }

    lastRangeRef.current = {
      startIso,
      endIso,
    };

    try {
      const data = await adminService.getEmployeesWorkingTimesRange(startIso, endIso);

      setLastWorkingData(data);
      setEvents(buildEventsFromData(data));

      // Fetch blocked times for all employees
      await fetchBlockedTimes(data, startIso, endIso);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load working times`, error);
    }
  };

  const fetchBlockedTimes = async (workingData, startIso) => {
    try {
      // Get unique employee IDs
      const employeeIds = [...new Set(
        workingData.flatMap((day) =>
          (day.employees || []).map((emp) => emp.employeeId),
        ),
      )];

      if (employeeIds.length === 0) return;

      // Fetch blocked times for each employee
      const blockedTimesPromises = employeeIds.map((employeeId) =>
        adminService.getEmployeeBlockedTimes(employeeId, startIso)
          .then((times) => {
            return {
              employeeId,
              times,
            };
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(`[fetchBlockedTimes] Employee ${employeeId}: failed`, error);
            return {
              employeeId,
              times: [],
            };
          }),
      );

      const results = await Promise.all(blockedTimesPromises);

      // Create a map: employeeId -> blocked times
      const newBlockedTimesMap = new Map();
      results.forEach(({
        employeeId, times,
      }) => {
        newBlockedTimesMap.set(employeeId, times);
      });

      setBlockedTimesMap(newBlockedTimesMap);
      // Note: useEffect will trigger re-render when blockedTimesMap changes
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load blocked times`, error);
    }
  };

  const getEmployeeName = (employeeId) => {
    const entry = employeeNameMap.get(Number(employeeId));
    if (!entry) return `Employee ${employeeId}`;
    const first = entry.firstName || ``;
    const last = entry.lastName || ``;
    const full = `${first} ${last}`.trim();
    return full || `Employee ${employeeId}`;
  };

  const intersects = (setA, setB) => {
    if (!setA || !setB) return false;
    for (const v of setA) { if (setB.has(v)) return true; }
    return false;
  };

  const doesEmployeePassFilters = (employeeId) => {
    const hasAny = selectedFilters.categories.size > 0
      || selectedFilters.subCategories.size > 0
      || selectedFilters.services.size > 0
      || selectedFilters.employees.size > 0;

    if (!hasAny) return true;

    // Check employee filter first (most specific)
    if (selectedFilters.employees.size > 0) {
      const passesEmployeeFilter = selectedFilters.employees.has(Number(employeeId));
      if (!passesEmployeeFilter) return false;

      // If only employee filter is set, pass
      if (selectedFilters.categories.size === 0
        && selectedFilters.subCategories.size === 0
        && selectedFilters.services.size === 0) {
        return true;
      }
    }

    // Check service filters
    const entry = employeeServicesMapRef.current.get(Number(employeeId));
    if (!entry) return false;

    const matchService = selectedFilters.services.size > 0
      && intersects(entry.serviceIds, selectedFilters.services);
    const matchSub = selectedFilters.subCategories.size > 0
      && intersects(entry.subCategoryIds, selectedFilters.subCategories);
    const matchCat = selectedFilters.categories.size > 0
      && intersects(entry.categoryIds, selectedFilters.categories);

    return matchService || matchSub || matchCat;
  };

  const buildEventsFromData = (data) => {
    // Add timestamp to force re-render when blockedTimesMap changes
    const timestamp = Date.now();

    return data.flatMap((day) => {
      const dayStart = day.date;
      return (day.employees || [])
        .filter((employee) => doesEmployeePassFilters(employee.employeeId))
        .map((employee) => {
          const extendedProps = {
            employeeId: employee.employeeId,
          };

          // Add pause time if exists
          if (employee.blockStartTimeFirst && employee.blockEndTimeFirst) {
            extendedProps.pauseTime = {
              start: employee.blockStartTimeFirst,
              end: employee.blockEndTimeFirst,
            };
          }

          return {
            id: `${dayStart}-${employee.employeeId}-${timestamp}`,
            title: getEmployeeName(employee.employeeId),
            start: `${dayStart}T${employee.startTime}`,
            end: `${dayStart}T${employee.endTime}`,
            extendedProps,
          };
        });
    });
  };

  useEffect(() => {
    if (!lastWorkingData || !Array.isArray(lastWorkingData)) return;
    setEvents(buildEventsFromData(lastWorkingData));
  }, [selectedFilters, lastWorkingData, employeeNameMap, blockedTimesMap]);

  useEffect(() => {
    // Load services meta once for filters/mapping
    const loadMeta = async () => {
      try {
        const [categories, subCategories, services] = await Promise.all([
          serviceService.getServiceCategories([`active`]),
          serviceService.getServiceSubCategories([`active`]),
          serviceService.getServices([`active`]),
        ]);
        setServicesMeta({
          categories,
          subCategories,
          services,
        });
        // Build employee -> {categoryIds, subCategoryIds, serviceIds}
        const map = new Map();
        for (const svc of services || []) {
          const categoryId = svc.categoryId;
          const subCategoryId = svc.subCategoryId;
          const serviceId = svc.id;
          const prices = Array.isArray(svc.employeePrices) ? svc.employeePrices : [];
          for (const p of prices) {
            const empId = Number(p.employeeId);
            if (!map.has(empId)) {
              map.set(empId, {
                categoryIds: new Set(),
                subCategoryIds: new Set(),
                serviceIds: new Set(),
              });
            }
            const entry = map.get(empId);
            if (categoryId != null) entry.categoryIds.add(categoryId);
            if (subCategoryId != null) entry.subCategoryIds.add(subCategoryId);
            entry.serviceIds.add(serviceId);
          }
        }
        employeeServicesMapRef.current = map;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to load services meta`, error);
      }
    };
    const loadEmployees = async () => {
      try {
        const employees = await adminService.getEmployees([`active`]);
        const m = new Map();
        for (const emp of employees || []) {
          m.set(Number(emp.employeeId), {
            firstName: emp.firstName,
            lastName: emp.lastName,
          });
        }
        setEmployeeNameMap(m);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to load employees`, error);
      }
    };
    loadMeta();
    loadEmployees();
  }, []);

  const toggleIdInSet = (set, id) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  };

  const toggleCategory = (id) => {
    setSelectedFilters((prev) => ({
      categories: toggleIdInSet(prev.categories, id),
      subCategories: new Set(prev.subCategories),
      services: new Set(prev.services),
      employees: new Set(prev.employees),
    }));
  };
  const toggleSubCategory = (id) => {
    setSelectedFilters((prev) => ({
      categories: new Set(prev.categories),
      subCategories: toggleIdInSet(prev.subCategories, id),
      services: new Set(prev.services),
      employees: new Set(prev.employees),
    }));
  };
  const toggleService = (id) => {
    setSelectedFilters((prev) => ({
      categories: new Set(prev.categories),
      subCategories: new Set(prev.subCategories),
      services: toggleIdInSet(prev.services, id),
      employees: new Set(prev.employees),
    }));
  };

  const toggleEmployee = (id) => {
    setSelectedFilters((prev) => ({
      categories: new Set(prev.categories),
      subCategories: new Set(prev.subCategories),
      services: new Set(prev.services),
      employees: toggleIdInSet(prev.employees, id),
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      categories: new Set(),
      subCategories: new Set(),
      services: new Set(),
      employees: new Set(),
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getActiveFiltersCount = () => {
    return selectedFilters.categories.size
      + selectedFilters.subCategories.size
      + selectedFilters.services.size
      + selectedFilters.employees.size;
  };

  const openEmployeeDrawer = async (employeeId) => {
    setDrawerEmployee({
      id: employeeId,
      name: getEmployeeName(employeeId),
    });
    setEmployeeCategoryTree([]);
    setDrawerLoading(true);
    setDrawerOpen(true);
    try {
      // Load categories, subcategories and services (active)
      const [categories, subCategories, services] = await Promise.all([
        serviceService.getServiceCategories([`active`]),
        serviceService.getServiceSubCategories([`active`]),
        serviceService.getServices([`active`]),
      ]);

      // Filter services by employee id
      const employeeServices = (services || []).filter((svc) => Array.isArray(svc.employeePrices)
        && svc.employeePrices.some((p) => Number(p.employeeId) === Number(employeeId)));

      // Build sets of categoryIds and subCategoryIds for this employee
      const categoryIdSet = new Set(employeeServices.map((s) => s.categoryId).filter((id) => id != null));
      const subCategoryIdSet = new Set(employeeServices.map((s) => s.subCategoryId).filter((id) => id != null));

      // Group services without subcategory by category
      const directServicesByCategory = new Map();
      for (const svc of employeeServices) {
        if (!svc.subCategoryId && svc.categoryId != null) {
          if (!directServicesByCategory.has(svc.categoryId)) directServicesByCategory.set(svc.categoryId, []);
          directServicesByCategory.get(svc.categoryId).push({
            id: svc.id,
            name: svc.name,
          });
        }
      }

      // Build tree: categories -> subcategories (filtered by those used by employee)
      const tree = (categories || [])
        .filter((c) => categoryIdSet.has(c.id) || directServicesByCategory.has(c.id))
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          subCategories: (subCategories || [])
            .filter((sub) => sub.categoryId === cat.id && subCategoryIdSet.has(sub.id))
            .map((sub) => ({
              id: sub.id,
              name: sub.name,
            })),
          services: directServicesByCategory.get(cat.id) || [],
        }))
        .filter((node) => node.subCategories.length > 0 || node.services.length > 0);

      setEmployeeCategoryTree(tree);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load employee services`, error);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Save calendar settings to localStorage whenever they change
  useEffect(() => {
    saveSettingsToStorage(calendarSettings);
  }, [calendarSettings]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(selectedFilters);
  }, [selectedFilters]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.changeView(view);
    fetchWorkingTimes();
  }, [view]);

  // Swipe for prev/next
  const touchStart = useRef({
    x: 0,
    y: 0,
    t: 0,
  });
  const onTouchStart = (error) => {
    const touch = error.touches?.[0];
    if (!touch) return;

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      t: Date.now(),
    };
  };

  const onTouchEnd = (event) => {
    const touch = event?.changedTouches?.[0];
    if (!touch) return;

    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.t;
    if (Math.abs(dx) > 50 && Math.abs(dy) < 60 && dt < 800) {
      const api = calendarRef.current?.getApi();
      if (!api) return;

      if (dx < 0) api.next(); else api.prev();
    }
  };

  return (
    <PageContainer
      pageTitle="Team Schedule"
      hideSideNav
    >
      <Box
        sx={{
          display: `flex`,
          alignItems: `center`,
          mb: 2,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => {
            const api = calendarRef.current?.getApi();
            if (!api) return;
            api.today();
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

        <Box
          sx={{
            display: `flex`,
            alignItems: `center`,
            ml: `auto`,
            gap: 1,
          }}
        >
          <IconButton
            size="small"
            onClick={(error) => setSettingsAnchorEl(error.currentTarget)}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>

          <Box
            sx={{
              display: `flex`,
              gap: 0.5,
              alignItems: `center`,
            }}
          >
            <Badge
              badgeContent={getActiveFiltersCount()}
              color="primary"
              max={99}
            >
              <Button
                size="small"
                variant={isFilterOpen ? `contained` : `outlined`}
                startIcon={<FilterListIcon />}
                onClick={(error) => setFilterAnchorEl(isFilterOpen ? null : error.currentTarget)}
              >
                Filters
              </Button>
            </Badge>

            {getActiveFiltersCount() > 0 && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={clearFilters}
                sx={{
                  minWidth: `auto`,
                  px: 1,
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          ml: { sm: `auto` },
          mb: 2,
          justifyContent: `space-between`,
        }}
      >
        <ToggleButton
          value="prev"
          size="small"
          onClick={() => { const api = calendarRef.current?.getApi(); api?.prev(); }}
        >◀
        </ToggleButton>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_e, newView) => { if (newView) setView(newView); }}
          size="small"
        >
          <ToggleButton value="timeGridDay">1 day</ToggleButton>
          <ToggleButton value="timeGridThreeDay">3 days</ToggleButton>
          <ToggleButton value="timeGridWeek">Week</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButton
          value="next"
          size="small"
          onClick={() => { const api = calendarRef.current?.getApi(); api?.next(); }}
        >▶
        </ToggleButton>
      </Stack>

      <CalendarSettingsMenu
        open={isSettingsOpen}
        anchorEl={settingsAnchorEl}
        onClose={() => setSettingsAnchorEl(null)}
        settings={calendarSettings}
        onSettingsChange={setCalendarSettings}
      />

      <CalendarFiltersMenu
        open={isFilterOpen}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        selectedFilters={selectedFilters}
        expandedSections={expandedSections}
        servicesMeta={servicesMeta}
        employeeNameMap={employeeNameMap}
        onToggleCategory={toggleCategory}
        onToggleSubCategory={toggleSubCategory}
        onToggleService={toggleService}
        onToggleEmployee={toggleEmployee}
        onClearFilters={clearFilters}
        onToggleSection={toggleSection}
      />

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
            '--fc-today-bg-color': `transparent`,
          },
          '& .fc .fc-timegrid-slot, & .fc .fc-timegrid-slot-label, & .fc .fc-timegrid-slot-lane': {
            height: `28px !important`,
            lineHeight: `28px !important`,
          },
          '& .fc-theme-standard .fc-scrollgrid': { border: `none` },
          '& .fc-theme-standard td, & .fc-theme-standard th': { borderColor: `rgba(0,0,0,0.06)` },
          '& .fc-col-header, & .fc-theme-standard th': { backgroundColor: `rgba(0,0,0,0.02)` },
          '& .fc-timegrid-slot': { backgroundColor: `rgba(0,0,0,0.01)` },
          '& .fc-timegrid-slot-label-cushion': {
            color: `rgba(0,0,0,0.68)`,
            fontWeight: 500,
          },
          // Enable wrapping and hyphenation for event titles in narrow columns
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
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          locales={[deLocale]}
          locale="de"
          initialView="timeGridWeek"
          firstDay={1}
          views={{
            timeGridDay: { dayHeaderContent: (arg) => getDayHeaderText(arg.date, `long`) },
            timeGridThreeDay: {
              type: `timeGrid`,
              duration: { days: 3 },
              dayHeaderContent: (arg) => getDayHeaderText(arg.date, `short`),
            },
            timeGridWeek: {
              dayHeaderContent: (arg) => getDayHeaderText(arg.date, `short`),
              hiddenDays: calendarSettings.showSunday ? [] : [0],
            },
          }}
          headerToolbar={false}
          allDaySlot={false}
          slotDuration="00:30:00"
          slotMinTime={`${String(calendarSettings.minHour).padStart(2, `0`)}:00:00`}
          slotMaxTime={`${String(calendarSettings.maxHour).padStart(2, `0`)}:00:00`}
          slotLabelInterval={{ hours: 1 }}
          slotLabelFormat={{
            hour: `2-digit`,
            hour12: false,
          }}
          nowIndicator
          height="100%"
          events={events}
          eventClick={(clickInfo) => {
            const employeeId = clickInfo?.event?.extendedProps?.employeeId;
            if (employeeId != null) {
              openEmployeeDrawer(employeeId);
            }
          }}
          eventDidMount={(info) => {
            const employeeId = info.event.extendedProps?.employeeId;
            const pauseTime = info.event.extendedProps?.pauseTime;
            const color = getEmployeeColor(employeeId);
            if (color) {
              info.el.style.backgroundColor = color.bg;
              info.el.style.borderColor = color.border;
              info.el.style.color = color.text;
              info.el.style.boxShadow = `0 2px 8px rgba(0,0,0,0.08)`;
              info.el.style.borderRadius = `6px`;
            }

            // Draw pause time overlay first (if exists)
            if (pauseTime && pauseTime.start && pauseTime.end) {
              const eventStart = info.event.start;
              const eventEnd = info.event.end;
              const eventDate = info.event.start.toISOString().split(`T`)[0]; // YYYY-MM-DD

              const pauseStartStr = `${eventDate}T${pauseTime.start}`;
              const pauseEndStr = `${eventDate}T${pauseTime.end}`;
              const pauseStart = new Date(pauseStartStr);
              const pauseEnd = new Date(pauseEndStr);

              // Only draw if pause time overlaps with event time
              if (pauseEnd > eventStart && pauseStart < eventEnd) {
                // Trim to event boundaries
                const actualStart = pauseStart < eventStart ? eventStart : pauseStart;
                const actualEnd = pauseEnd > eventEnd ? eventEnd : pauseEnd;

                // Calculate position and height
                const eventDuration = eventEnd - eventStart;
                const pauseOffsetFromStart = actualStart - eventStart;
                const pauseDuration = actualEnd - actualStart;

                const topPercent = (pauseOffsetFromStart / eventDuration) * 100;
                const heightPercent = (pauseDuration / eventDuration) * 100;

                // Create pause overlay element (orange/yellow for lunch break)
                const overlay = document.createElement(`div`);
                overlay.style.position = `absolute`;
                overlay.style.top = `${topPercent}%`;
                overlay.style.height = `${heightPercent}%`;
                overlay.style.left = `0`;
                overlay.style.right = `0`;
                overlay.style.backgroundColor = `rgba(255, 152, 0, 0.25)`;
                overlay.style.borderTop = `2px dashed #FF9800`;
                overlay.style.borderBottom = `2px dashed #FF9800`;
                overlay.style.backgroundImage = `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(255, 152, 0, 0.15) 10px,
                  rgba(255, 152, 0, 0.15) 20px
                )`;
                overlay.style.pointerEvents = `none`;
                overlay.style.zIndex = `4`;

                // Add to event element
                const eventMain = info.el.querySelector(`.fc-event-main`);
                if (eventMain) {
                  eventMain.style.position = `relative`;
                  eventMain.appendChild(overlay);
                }
              }
            }

            // Draw blocked time overlays
            const blockedTimes = blockedTimesMap.get(employeeId) || [];

            if (blockedTimes.length > 0) {
              const eventStart = info.event.start;
              const eventEnd = info.event.end;
              const eventDate = info.event.start.toISOString().split(`T`)[0]; // YYYY-MM-DD

              blockedTimes.forEach((blockedTime) => {
                if (blockedTime.blockedDate !== eventDate) {
                  return; // Different day
                }

                let blockStart, blockEnd;

                if (blockedTime.isAllDay) {
                  // Block entire working time
                  blockStart = eventStart;
                  blockEnd = eventEnd;
                } else {
                  // Block specific time range
                  const blockStartStr = `${blockedTime.blockedDate}T${blockedTime.startTime}`;
                  const blockEndStr = `${blockedTime.blockedDate}T${blockedTime.endTime}`;
                  blockStart = new Date(blockStartStr);
                  blockEnd = new Date(blockEndStr);

                  // Only draw if blocked time overlaps with event time
                  if (blockEnd <= eventStart || blockStart >= eventEnd) return;

                  // Trim to event boundaries
                  if (blockStart < eventStart) blockStart = eventStart;
                  if (blockEnd > eventEnd) blockEnd = eventEnd;
                }

                // Calculate position and height
                const eventDuration = eventEnd - eventStart;
                const blockOffsetFromStart = blockStart - eventStart;
                const blockDuration = blockEnd - blockStart;

                const topPercent = (blockOffsetFromStart / eventDuration) * 100;
                const heightPercent = (blockDuration / eventDuration) * 100;

                // Create overlay element
                const overlay = document.createElement(`div`);
                overlay.style.position = `absolute`;
                overlay.style.top = `${topPercent}%`;
                overlay.style.height = `${heightPercent}%`;
                overlay.style.left = `0`;
                overlay.style.right = `0`;
                overlay.style.backgroundColor = `rgba(244, 67, 54, 0.35)`;
                overlay.style.borderTop = `2px dashed #f44336`;
                overlay.style.borderBottom = `2px dashed #f44336`;
                overlay.style.backgroundImage = `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(244, 67, 54, 0.2) 10px,
                  rgba(244, 67, 54, 0.2) 20px
                )`;
                overlay.style.pointerEvents = `none`;
                overlay.style.zIndex = `5`;

                // Add to event element
                const eventMain = info.el.querySelector(`.fc-event-main`);
                if (eventMain) {
                  eventMain.style.position = `relative`;
                  eventMain.appendChild(overlay);
                }
              });
            }
          }}
          datesSet={() => fetchWorkingTimes()}
        />
      </Box>

      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onOpen={() => {}}
        onClose={() => setDrawerOpen(false)}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            p: 2,
            maxHeight: `80vh`,
          },
        }}
      >
        <Box
          sx={{
            minWidth: {
              xs: 300,
              sm: 360,
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {drawerEmployee?.name || `Employee`}
            </Typography>
            <Chip
              size="small"
              label={`Categories: ${employeeCategoryTree?.length || 0}`}
            />
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {drawerLoading ? (
            <Typography variant="body2">Loading...</Typography>
          ) : (
            <Stack spacing={1.25}>
              {employeeCategoryTree?.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  No categories for this employee.
                </Typography>
              )}
              {employeeCategoryTree?.map((cat) => (
                <Box
                  key={cat.id}
                  sx={{
                    border: `1px solid rgba(0,0,0,0.08)`,
                    borderRadius: 1,
                    p: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700 }}
                  >
                    {cat.name}
                  </Typography>
                  <Stack
                    spacing={0.5}
                    sx={{ mt: 0.5 }}
                  >
                    {cat.subCategories.map((sub) => (
                      <Typography
                        key={sub.id}
                        variant="body2"
                      >
                        - {sub.name}
                      </Typography>
                    ))}
                    {cat.services?.length > 0 && (
                      <>
                        {cat.subCategories.length > 0 && (
                          <Divider sx={{ my: 0.75 }} />
                        )}
                        {cat.services.map((svc) => (
                          <Typography
                            key={svc.id}
                            variant="body2"
                          >
                            - {svc.name}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </SwipeableDrawer>
    </PageContainer>
  );
}

function getEmployeeColor(employeeId) {
  if (!employeeId && employeeId !== 0) return null;
  const hue = (Number(employeeId) * 40) % 360;
  // Softer pastel palette: lower saturation, higher lightness
  const bg = `hsl(${hue} 70% 70%)`;
  const border = `hsl(${hue} 70% 70%)`;
  const text = `black`;
  return {
    bg,
    border,
    text,
  };
}

function getDayHeaderText(dateLike, weekdayLength = `short`) {
  try {
    const date = new Date(dateLike.valueOf ? dateLike.valueOf() : dateLike);
    const weekday = new Intl.DateTimeFormat(`de-DE`, { weekday: weekdayLength })
      .format(date)
      .replace(/\.$/, ``);
    const day = String(date.getDate());
    const month = String(date.getMonth() + 1).padStart(2, `0`);
    return `${weekday} ${day}.${month}`;
  } catch {
    return ``;
  }
}
