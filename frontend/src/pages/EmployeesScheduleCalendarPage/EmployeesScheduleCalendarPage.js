import deLocale from '@fullcalendar/core/locales/de';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Settings as SettingsIcon, FilterList as FilterListIcon } from '@mui/icons-material';
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
  SwipeableDrawer,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import PageContainer from '@/components/PageContainer/PageContainer';
import adminService from '@/services/employees.service';
import serviceService from '@/services/services.service';

export default function EmployeesScheduleCalendarPage() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(`timeGridWeek`);
  const calendarRef = useRef(null);
  const lastRangeRef = useRef({
    startIso: ``,
    endIso: ``,
  });
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const isSettingsOpen = Boolean(settingsAnchorEl);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const isFilterOpen = Boolean(filterAnchorEl);
  const [calendarSettings, setCalendarSettings] = useState({
    minHour: 10,
    maxHour: 20,
    showSunday: false,
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
  const [selectedFilters, setSelectedFilters] = useState({
    categories: new Set(),
    subCategories: new Set(),
    services: new Set(),
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
    if (lastRangeRef.current.startIso === startIso && lastRangeRef.current.endIso === endIso) return;
    lastRangeRef.current = {
      startIso,
      endIso,
    };
    try {
      const data = await adminService.getEmployeesWorkingTimesRange(startIso, endIso);
      setLastWorkingData(data);
      setEvents(buildEventsFromData(data));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load working times`, e);
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
      || selectedFilters.services.size > 0;
    if (!hasAny) return true;
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
    return data.flatMap((day) => {
      const dayStart = day.date;
      return (day.employees || [])
        .filter((emp) => doesEmployeePassFilters(emp.employeeId))
        .map((emp) => ({
          id: `${dayStart}-${emp.employeeId}`,
          title: getEmployeeName(emp.employeeId),
          start: `${dayStart}T${emp.startTime}`,
          end: `${dayStart}T${emp.endTime}`,
          extendedProps: {
            employeeId: emp.employeeId,
          },
        }));
    });
  };

  useEffect(() => {
    if (!lastWorkingData || !Array.isArray(lastWorkingData)) return;
    setEvents(buildEventsFromData(lastWorkingData));
  }, [selectedFilters, lastWorkingData, employeeNameMap]);

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
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed to load services meta`, e);
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
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed to load employees`, e);
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
    }));
  };
  const toggleSubCategory = (id) => {
    setSelectedFilters((prev) => ({
      categories: new Set(prev.categories),
      subCategories: toggleIdInSet(prev.subCategories, id),
      services: new Set(prev.services),
    }));
  };
  const toggleService = (id) => {
    setSelectedFilters((prev) => ({
      categories: new Set(prev.categories),
      subCategories: new Set(prev.subCategories),
      services: toggleIdInSet(prev.services, id),
    }));
  };
  const clearFilters = () => {
    setSelectedFilters({
      categories: new Set(),
      subCategories: new Set(),
      services: new Set(),
    });
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
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load employee services`, e);
    } finally {
      setDrawerLoading(false);
    }
  };

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
  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStart.current = {
      x: t.clientX,
      y: t.clientY,
      t: Date.now(),
    };
  };
  const onTouchEnd = (ev) => {
    const t = ev?.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
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
            onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
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

      <Menu
        anchorEl={settingsAnchorEl}
        open={isSettingsOpen}
        onClose={() => setSettingsAnchorEl(null)}
      >
        <MenuItem disabled>Time range</MenuItem>
        <MenuItem
          onClick={() => {
            setCalendarSettings((s) => ({
              ...s,
              minHour: 8,
            }));
            setSettingsAnchorEl(null);
          }}
        >Start: 08:00
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCalendarSettings((s) => ({
              ...s,
              minHour: 9,
            }));
            setSettingsAnchorEl(null);
          }}
        >Start: 09:00
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCalendarSettings((s) => ({
              ...s,
              minHour: 10,
            }));
            setSettingsAnchorEl(null);
          }}
        >Start: 10:00
        </MenuItem>
        <MenuItem divider />
        <MenuItem
          onClick={() => {
            setCalendarSettings((s) => ({
              ...s,
              maxHour: 18,
            }));
            setSettingsAnchorEl(null);
          }}
        >End: 18:00
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCalendarSettings((s) => ({
              ...s,
              maxHour: 20,
            }));
            setSettingsAnchorEl(null);
          }}
        >End: 20:00
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCalendarSettings((s) => ({
              ...s,
              maxHour: 22,
            }));
            setSettingsAnchorEl(null);
          }}
        >End: 22:00
        </MenuItem>
        <MenuItem divider />
        <FormControlLabel
          sx={{
            pl: 1,
            pr: 2,
          }}
          control={(
            <Checkbox
              checked={Boolean(calendarSettings.showSunday)}
              onChange={(e) => setCalendarSettings((s) => ({
                ...s,
                showSunday: e.target.checked,
              }))}
              size="small"
            />
          )}
          label="Show Sunday in week view"
        />
      </Menu>

      <Menu
        anchorEl={filterAnchorEl}
        open={isFilterOpen}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{
          sx: {
            maxHeight: 480,
            width: 320,
          },
        }}
      >
        <MenuItem disabled>Filters</MenuItem>
        <Box
          sx={{
            px: 2,
            py: 1.5,
          }}
        >
          {(servicesMeta.categories || []).map((cat) => (
            <Box
              key={cat.id}
              sx={{ mb: 1 }}
            >
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={selectedFilters.categories.has(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    size="small"
                  />
                )}
                label={cat.name}
              />
              <Box sx={{ pl: 2 }}>
                {(servicesMeta.subCategories || [])
                  .filter((s) => s.categoryId === cat.id)
                  .map((sub) => (
                    <Box
                      key={sub.id}
                      sx={{ mb: 0.5 }}
                    >
                      <FormControlLabel
                        control={(
                          <Checkbox
                            checked={selectedFilters.subCategories.has(sub.id)}
                            onChange={() => toggleSubCategory(sub.id)}
                            size="small"
                          />
                        )}
                        label={sub.name}
                      />
                      <Box
                        sx={{ pl: 2 }}
                      >
                        {(servicesMeta.services || [])
                          .filter((svc) => svc.subCategoryId === sub.id)
                          .map((svc) => (
                            <FormControlLabel
                              key={svc.id}
                              control={(
                                <Checkbox
                                  checked={selectedFilters.services.has(svc.id)}
                                  onChange={() => toggleService(svc.id)}
                                  size="small"
                                />
                              )}
                              label={svc.name}
                            />
                          ))}
                      </Box>
                    </Box>
                  ))}

                {(servicesMeta.services || [])
                  .filter((svc) => svc.categoryId === cat.id && (svc.subCategoryId == null))
                  .map((svc) => (
                    <FormControlLabel
                      key={svc.id}
                      control={(
                        <Checkbox
                          checked={selectedFilters.services.has(svc.id)}
                          onChange={() => toggleService(svc.id)}
                          size="small"
                        />
                      )}
                      label={svc.name}
                    />
                  ))}
              </Box>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Button
            size="small"
            color="inherit"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </Box>
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
            const color = getEmployeeColor(employeeId);
            if (color) {
              info.el.style.backgroundColor = color.bg;
              info.el.style.borderColor = color.border;
              info.el.style.color = color.text;
              info.el.style.boxShadow = `0 2px 8px rgba(0,0,0,0.08)`;
              info.el.style.borderRadius = `6px`;
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
    const d = new Date(dateLike.valueOf ? dateLike.valueOf() : dateLike);
    const weekday = new Intl.DateTimeFormat(`de-DE`, { weekday: weekdayLength })
      .format(d)
      .replace(/\.$/, ``);
    const day = String(d.getDate());
    const month = String(d.getMonth() + 1).padStart(2, `0`);
    return `${weekday} ${day}.${month}`;
  } catch {
    return ``;
  }
}
