import { Add, ArrowBack, ArrowForward, Delete } from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import daysOfWeek from '@/constants/daysOfWeek';
import {
  fetchEmployeeSchedulePeriods,
  createSchedulePeriod,
  upsertSchedulePeriodDay,
  fetchPeriodScheduleRows,
  updateRepeatCycleThunk,
  updateSchedulePeriodDates,
  deleteSchedulePeriodDay,
  deleteSchedulePeriod,
} from '@/features/employees/employeeSchedulePeriodsSlice';
import { formatIsoDate } from '@/utils/formatters';
import { formattedTime } from '@/utils/formatters';

function WeekTabs({
  repeatCycle,
  activeWeek,
  onChangeWeek,
}) {
  const weeks = Array.from({ length: repeatCycle }, (_, i) => i + 1);
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      color="secondary"
      value={activeWeek}
      onChange={(_, val) => {
        if (val) {
          onChangeWeek(val);
        }
      }}
      sx={{
        mb: 1,
        flexWrap: `wrap`,
        alignSelf: `center`,
      }}
    >
      {weeks.map(week => (
        <ToggleButton
          key={week}
          value={week}
          sx={{
            textTransform: `none`,
          }}
        >
          {`Week ${week}`}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

function DayEditor({
  onSave, onCancel, day, existing,
}) {
  const [start, setStart] = useState(existing?.startTime || ``);
  const [end, setEnd] = useState(existing?.endTime || ``);
  const [pauseStart, setPauseStart] = useState(existing?.blockStartTimeFirst || ``);
  const [pauseEnd, setPauseEnd] = useState(existing?.blockEndTimeFirst || ``);

  // Sync local form state when existing values arrive/change
  useEffect(() => {
    setStart(existing?.startTime || ``);
    setEnd(existing?.endTime || ``);
    setPauseStart(existing?.blockStartTimeFirst || ``);
    setPauseEnd(existing?.blockEndTimeFirst || ``);
  }, [existing?.startTime, existing?.endTime, existing?.blockStartTimeFirst, existing?.blockEndTimeFirst]);

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography
          variant="body2"
          sx={{
            minWidth: 80,
            flexGrow: 1,
          }}
        >
          {day.name}
        </Typography>

        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => onSave({
            startTime: start,
            endTime: end,
            blockStartTimeFirst: pauseStart || null,
            blockEndTimeFirst: pauseEnd || null,
          })}
        >
         Save
        </Button>

        <Button
          size="small"
          variant="text"
          color="secondary"
          onClick={onCancel}
        >
        Cancel
        </Button>
      </Stack>

      <Grid
        container
        spacing={1}
      >
        <Grid
          item
          xs={3}
        >
          <Typography variant="body2">Working time</Typography>
        </Grid>

        <Grid
          item
          xs={4.5}
        >
          <input
            value={start}
            onChange={e => setStart(e.target.value)}
            placeholder="10:00"
            style={{ width: `100%` }}
          />
        </Grid>

        <Grid
          item
          xs={4.5}
        >
          <input
            value={end}
            onChange={e => setEnd(e.target.value)}
            placeholder="20:00"
            style={{ width: `100%` }}
          />
        </Grid>
      </Grid>

      <Grid
        container
        spacing={1}
      >
        <Grid
          item
          xs={3}
        >
          <Typography variant="body2">Pause</Typography>
        </Grid>

        <Grid
          item
          xs={4.5}
        >
          <input
            value={pauseStart}
            onChange={e => setPauseStart(e.target.value)}
            placeholder="Pause from"
            style={{ width: `100%` }}
          />
        </Grid>

        <Grid
          item
          xs={4.5}
        >
          <input
            value={pauseEnd}
            onChange={e => setPauseEnd(e.target.value)}
            placeholder="Pause to"
            style={{ width: `100%` }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

function DayRow({
  day, existing, onSave, onDelete,
}) {
  const [isEditMode, setIsEditMode] = useState(false);

  if (isEditMode) {
    return (
      <Box
        sx={{
          padding: 1.5,
          marginBottom: 1,
          backgroundColor: `grey.50`,
          borderRadius: 1,
          border: `1px solid`,
          borderColor: `grey.200`,
        }}
      >
        <DayEditor
          day={day}
          existing={existing}
          onSave={async (body) => {
            await onSave(body);
            setIsEditMode(false);
          }}
          onDelete={async () => {
            await onDelete();
            setIsEditMode(false);
          }}
          onCancel={() => setIsEditMode(false)}
        />
      </Box>
    );
  }

  const hasWorkingTime = Boolean(
    existing &&
    existing.startTime &&
    existing.endTime &&
    (
      existing.startTime !== `00:00:00` ||
      existing.endTime !== `00:00:00`
    ),
  );

  return (
    <Box
      sx={{
        display: `flex`,
        alignItems: `center`,
        padding: 1.5,
        marginBottom: 1,
        backgroundColor: `grey.50`,
        borderRadius: 1,
        border: `1px solid`,
        borderColor: `grey.200`,
        gap: 1,
      }}
    >
      <Grid
        container
        spacing={1}
        alignItems="center"
      >
        <Grid
          item
          xs={4}
        >
          <Typography
            variant="body2"
            sx={{
              minWidth: 80,
              fontWeight: 500,
              color: `text.primary`,
            }}
          >
            {day.name}
          </Typography>
        </Grid>

        <Grid
          item
          xs={4}
        >
          <Typography
            variant="body2"
            sx={{
              color: hasWorkingTime ? `text.primary` : `text.secondary`,
              minWidth: 160,
            }}
          >
            {hasWorkingTime ? (
              <>
                {formattedTime(existing.startTime)} - {formattedTime(existing.endTime)}<br />
                {existing.blockStartTimeFirst && existing.blockEndTimeFirst && (
                  <Typography
                    variant="body2"
                    sx={{ color: `text.secondary` }}
                  >
                    {`Pause:`}<br />
                    {formattedTime(existing.blockStartTimeFirst)} - {formattedTime(existing.blockEndTimeFirst)}
                  </Typography>
                )}
              </>
            ) : (
              `Not working`
            )}
          </Typography>
        </Grid>

        <Grid
          item
          xs={4}
        >
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ flexGrow: 1 }}
          >
            {hasWorkingTime ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => setIsEditMode(true)}
                  sx={{
                    minWidth: `auto`,
                    padding: `4px 8px`,
                    fontSize: `0.75rem`,
                  }}
                >
                  Change
                </Button>

                <IconButton
                  size="small"
                  onClick={onDelete}
                  sx={{ padding: `4px` }}
                  color="secondary"
                >
                  <Delete sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            ) : (
              <Button
                size="small"
                variant="contained"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={() => setIsEditMode(true)}
                color="secondary"
                sx={{
                  padding: `4px 8px`,
                  fontSize: `0.75rem`,
                  width: `100%`,
                }}
              >
                Add
              </Button>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function EmployeeSchedulePeriods({ employeeId }) {
  const dispatch = useDispatch();
  const { periods } = useSelector(state => state.employeeSchedulePeriods);
  const periodSchedules = useSelector(state => state.employeeSchedulePeriods.periodSchedules);
  const [periodIndex, setPeriodIndex] = useState(0);
  const period = periods[periodIndex] || null;
  const [activeWeek, setActiveWeek] = useState(1);
  const [editFrom, setEditFrom] = useState(``);
  const [editUntil, setEditUntil] = useState(``);
  const [dateError, setDateError] = useState(``);
  const [toast, setToast] = useState({
    open: false,
    severity: `info`,
    message: ``,
  });
  const showToast = (severity, message) => setToast({
    open: true,
    severity,
    message,
  });
  const closeToast = () => setToast(prev => ({
    ...prev,
    open: false,
  }));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFrom, setNewFrom] = useState(``);
  const [newUntil, setNewUntil] = useState(``);
  const [newCycle, setNewCycle] = useState(1);
  const [openFrom, setOpenFrom] = useState(false);
  const [openUntil, setOpenUntil] = useState(false);
  const lastPeriod = periods.length ? periods[periods.length - 1] : null;
  const fromPendingRef = useRef(``);
  const untilPendingRef = useRef(``);
  const fromChangeCommitTsRef = useRef(0);
  const untilChangeCommitTsRef = useRef(0);
  const createFromMinDate = useMemo(() => {
    if (!lastPeriod || !lastPeriod.validUntil) return null;
    return dayjs(lastPeriod.validUntil).add(1, `day`);
  }, [lastPeriod]);
  const createUntilMinDate = useMemo(() => (newFrom ? dayjs(newFrom).add(1, `day`) : null), [newFrom]);

  // no refs needed; onAccept uses provided newValue

  useEffect(() => {
    dispatch(fetchEmployeeSchedulePeriods(employeeId));
  }, [employeeId]);

  useEffect(() => {
    setActiveWeek(1);
    // Reset any inline errors and close creation form/pickers when switching periods
    setDateError(``);
    setIsCreateOpen(false);
    setOpenFrom(false);
    setOpenUntil(false);
  }, [periodIndex]);

  // Ensure schedule rows are loaded when the selected period changes or after initial fetch
  useEffect(() => {
    if (period && period.id) {
      dispatch(fetchPeriodScheduleRows(period.id));
    }
    setEditFrom(period?.validFrom || ``);
    setEditUntil(period?.validUntil || ``);
  }, [dispatch, period && period.id]);

  const canGoPrev = periodIndex > 0;
  const canGoNext = periodIndex < periods.length;

  const periodTitle = useMemo(() => {
    if (!period) return ``;
    return `${formatIsoDate(period.validFrom)}${period.validUntil ? ` → ${formatIsoDate(period.validUntil)}` : ``}`;
  }, [period]);

  const prevPeriod = periodIndex > 0 ? periods[periodIndex - 1] : null;
  const validFromMinDate = useMemo(() => {
    if (!prevPeriod || !prevPeriod.validUntil) return null;
    return dayjs(prevPeriod.validUntil).add(1, `day`);
  }, [prevPeriod]);

  const validUntilMinDate = useMemo(() => {
    return editFrom ? dayjs(editFrom).add(1, `day`) : null;
  }, [editFrom]);

  const getExistingForDay = (weekNumber, dayId) => {
    if (!period) return null;
    const rows = (periodSchedules[period.id] || []).filter(r => r.weekNumberInCycle === weekNumber && r.dayId === dayId);
    if (rows.length === 0) return null;
    const isMeaningful = (r) => (r.startTime !== `00:00:00` || r.endTime !== `00:00:00` || r.blockStartTimeFirst || r.blockEndTimeFirst);
    const preferred = rows.find(isMeaningful) || rows[0];
    return {
      startTime: preferred.startTime,
      endTime: preferred.endTime,
      blockStartTimeFirst: preferred.blockStartTimeFirst,
      blockEndTimeFirst: preferred.blockEndTimeFirst,
    };
  };

  const onCreatePeriod = () => {
    // Prefill Monday as valid_from and +2 years as valid_until
    // If there is a current period with finite end, suggest next day after its end
    const last = periods[periods.length - 1] || null;
    if (last && last.validUntil) {
      const nextDay = dayjs(last.validUntil).add(1, `day`).format(`YYYY-MM-DD`);
      setNewFrom(nextDay);
    } else {
      const today = dayjs().format(`YYYY-MM-DD`);
      setNewFrom(today);
    }
    setNewCycle(1);
    setIsCreateOpen(true);
  };

  const onSaveDay = async (weekNumber, dayId, body) => {
    await dispatch(upsertSchedulePeriodDay({
      periodId: period.id,
      weekNumber,
      dayId,
      body,
    }));
    dispatch(fetchPeriodScheduleRows(period.id));
  };

  const onDeleteDay = async (weekNumber, dayId) => {
    await dispatch(deleteSchedulePeriodDay({
      periodId: period.id,
      weekNumber,
      dayId,
    }));
    dispatch(fetchPeriodScheduleRows(period.id));
  };

  const onChangeFrom = async (value) => {
    setEditFrom(value);
    if (!period) return;
    try {
      const body = {
        validFrom: value,
        validUntil: editUntil || period.validUntil,
      };
      await dispatch(updateSchedulePeriodDates({
        periodId: period.id,
        body,
      })).unwrap();
      setDateError(``);
      showToast(`success`, `Dates saved`);
      dispatch(fetchEmployeeSchedulePeriods(employeeId));
    } catch (e) {
      const msg = typeof e === `string` ? e : (e?.message || JSON.stringify(e));
      setDateError(msg);
      showToast(`error`, msg);

      // rollback UI to last valid value
      setEditFrom(period.validFrom);
    }
  };

  const onChangeUntil = async (value) => {
    setEditUntil(value);
    if (!period) return;
    try {
      const body = {
        periodId: period.id,
        body: {
          validFrom: editFrom || period.validFrom,
          validUntil: value,
        },
      };
      await dispatch(updateSchedulePeriodDates(body)).unwrap();
      setDateError(``);
      showToast(`success`, `Dates saved`);
      dispatch(fetchEmployeeSchedulePeriods(employeeId));
    } catch (e) {
      const msg = typeof e === `string` ? e : (e?.message || JSON.stringify(e));
      setDateError(msg);
      showToast(`error`, msg);
      // rollback UI to last valid value
      setEditUntil(period.validUntil);
    }
  };

  // NOTE: commits are triggered inline in onChange/actionBar handlers now

  const onChangeRepeatCycle = async (value) => {
    try {
      await dispatch(updateRepeatCycleThunk({
        periodId: period.id,
        repeatCycle: Number(value),
      })).unwrap();
      showToast(`success`, `Repeat cycle updated`);
      dispatch(fetchEmployeeSchedulePeriods(employeeId));
    } catch (e) {
      const raw = typeof e === `string` ? e : (e?.message || JSON.stringify(e));
      const friendly = /Existing week numbers exceed new repeat_cycle/i.test(raw)
        ? `Cannot reduce repeat cycle because some scheduled weeks exceed the new cycle. Remove or move those weeks first, then try again.`
        : raw;
      showToast(`error`, friendly);
    }
  };

  const onDeletePeriod = async () => {
    if (!period) return;
    try {
      const action = await dispatch(deleteSchedulePeriod(period.id));
      if (deleteSchedulePeriod.fulfilled.match(action)) {
        showToast(`success`, `Period deleted`);
        const newIndex = Math.max(0, periodIndex - 1);
        setPeriodIndex(newIndex);
        dispatch(fetchEmployeeSchedulePeriods(employeeId));
      } else {
        const msg = action.payload || action.error?.message;
        showToast(`error`, typeof msg === `string` ? msg : JSON.stringify(msg));
      }
    } catch (e) {
      const msg = typeof e === `string` ? e : (e?.message || JSON.stringify(e));
      showToast(`error`, msg);
    }
  };

  const onSubmitCreate = async () => {
    if (!newFrom) return;
    // Clear previous errors (toasts are used)

    try {
      await dispatch(createSchedulePeriod({
        employeeId,
        body: {
          validFrom: newFrom,
          validUntil: newUntil || null,
          repeatCycle: Number(newCycle),
        },
      })).unwrap();

      setIsCreateOpen(false);
      showToast(`success`, `Period created`);
      setTimeout(() => dispatch(fetchEmployeeSchedulePeriods(employeeId)), 200);
    } catch (e) {
      const msg = typeof e === `string` ? e : (e?.message || JSON.stringify(e));
      showToast(`error`, msg);
    }
  };

  return (
    <Box
      sx={{
        display: `flex`,
        flexDirection: `column`,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <IconButton
          disabled={!canGoPrev}
          onClick={() => setPeriodIndex(oldValue => oldValue - 1)}
          color="secondary"
        >
          <ArrowBack />
        </IconButton>

        <Typography
          variant="subtitle2"
          sx={{
            flex: 1,
            textAlign: `center`,
          }}
        >
          {periodTitle}
        </Typography>

        <IconButton
          disabled={!canGoNext}
          onClick={() => setPeriodIndex(oldValue => oldValue + 1)}
          color="secondary"
        >
          <ArrowForward />
        </IconButton>
      </Stack>

      {period && (
        <>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid
              container
              spacing={2}
              sx={{ mb: 1 }}
            >
              <Grid
                item
                xs={6}
              >

                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale="de"
                >
                  <DatePicker
                    label="Valid from"
                    value={editFrom ? dayjs(editFrom) : null}
                    referenceDate={editFrom ? dayjs(editFrom) : (validFromMinDate || undefined)}
                    minDate={validFromMinDate || undefined}
                    open={openFrom}
                    onOpen={() => setOpenFrom(true)}
                    onClose={() => setOpenFrom(false)}
                    onChange={(newValue) => {
                      setEditFrom(newValue ? newValue.format(`YYYY-MM-DD`) : ``);
                      fromPendingRef.current = newValue ? newValue.format(`YYYY-MM-DD`) : ``;
                      if (newValue) {
                        fromChangeCommitTsRef.current = Date.now();
                        void onChangeFrom(newValue.format(`YYYY-MM-DD`));
                      }
                    }}
                    slotProps={{
                      textField: {
                        size: `small`,
                        color: `secondary`,
                        error: Boolean(dateError),
                        helperText: dateError || undefined,
                        sx: { maxWidth: `100%` },
                      },
                      actionBar: {
                        actions: [ `accept`, `cancel` ],
                        onAccept: () => {
                          const now = Date.now();
                          if (now - fromChangeCommitTsRef.current > 600) {
                            const v = fromPendingRef.current || editFrom || (period?.validFrom || ``);
                            if (v) void onChangeFrom(v);
                          }
                          setOpenFrom(false);
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid
                item
                xs={6}
              >
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale="de"
                >
                  <DatePicker
                    label="Valid until"
                    value={editUntil ? dayjs(editUntil) : null}
                    referenceDate={editFrom ? dayjs(editFrom).endOf(`month`) : undefined}
                    minDate={validUntilMinDate || undefined}
                    open={openUntil}
                    onOpen={() => setOpenUntil(true)}
                    onClose={() => setOpenUntil(false)}
                    onChange={(newValue) => {
                      if (!newValue) {
                        setEditUntil(``);
                      } else {
                        setEditUntil(newValue.format(`YYYY-MM-DD`));
                      }
                      untilPendingRef.current = newValue ? newValue.format(`YYYY-MM-DD`) : ``;
                      if (newValue) {
                        untilChangeCommitTsRef.current = Date.now();
                        void onChangeUntil(newValue.format(`YYYY-MM-DD`));
                      }
                    }}
                    slotProps={{
                      textField: {
                        size: `small`,
                        color: `secondary`,
                        error: Boolean(dateError),
                        sx: { maxWidth: `100%` },
                      },
                      actionBar: {
                        actions: [ `accept`, `cancel`, `clear` ],
                        onAccept: () => {
                          const now = Date.now();
                          if (now - untilChangeCommitTsRef.current > 600) {
                            const v = untilPendingRef.current;
                            void onChangeUntil(v === `` ? null : (v || editUntil || null));
                          }
                          setOpenUntil(false);
                        },
                        onClear: () => {
                          setEditUntil(``);
                          const now = Date.now();
                          if (now - untilChangeCommitTsRef.current > 600) {
                            void onChangeUntil(null);
                          }
                          setOpenUntil(false);
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid
                item
                xs={6}
              >
                <TextField
                  select
                  size="small"
                  label="Cycle"
                  color="secondary"
                  value={period.repeatCycle}
                  onChange={(e) => onChangeRepeatCycle(Number(e.target.value))}
                  sx={{
                    maxWidth: `231px`,
                    width: `100%`,
                  }}
                >
                  {[1,2,3,4].map(v => (
                    <MenuItem
                      key={v}
                      value={v}
                    >{`${v} week${v>1?`s`:``}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid
                item
                xs={6}
              >
                <Button
                  onClick={onDeletePeriod}
                  color="secondary"
                  variant="outlined"
                  size="small"
                  disabled={!period.canDelete}
                  sx={{
                    width: `100%`,
                    maxWidth: `231px`,
                  }}
                  startIcon={<Delete sx={{ fontSize: 16 }} />}
                >
                    Delete period
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>

          <WeekTabs
            repeatCycle={period.repeatCycle}
            activeWeek={activeWeek}
            onChangeWeek={setActiveWeek}
          />

          <Stack spacing={1}>
            {daysOfWeek.map(day => {
              const existing = getExistingForDay(activeWeek, day.id);
              return (
                <DayRow
                  key={day.id}
                  day={day}
                  existing={existing}
                  onSave={(body) => onSaveDay(activeWeek, day.id, body)}
                  onDelete={() => onDeleteDay(activeWeek, day.id)}
                />
              );
            })}
          </Stack>
        </>
      )}

      {!period && !isCreateOpen &&(
        <Button
          size="medium"
          startIcon={<Add />}
          onClick={onCreatePeriod}
          color="secondary"
          variant="contained"
          sx={{ margin: `10rem auto` }}
        >
          Add new period
        </Button>
      )}

      {isCreateOpen && !period && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="h5"
            sx={{ textAlign: `center` }}
          >
            Create new period
          </Typography>

          <Grid
            container
            spacing={2}
            sx={{ mt: 1 }}
          >
            <Grid
              item
              xs={6}
            >
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="de"
              >
                <DatePicker
                  label="Valid from"
                  value={newFrom ? dayjs(newFrom) : null}
                  referenceDate={newFrom ? dayjs(newFrom) : (createFromMinDate || undefined)}
                  minDate={createFromMinDate || undefined}
                  onChange={(newValue) => setNewFrom(newValue ? newValue.format(`YYYY-MM-DD`) : ``)}
                  slotProps={{
                    textField: {
                      size: `small`,
                      color: `secondary`,
                      sx: { maxWidth: `100%` },
                    },
                    actionBar: { actions: [ `accept`, `cancel` ] },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid
              item
              xs={6}
            >
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="de"
              >
                <DatePicker
                  label="Valid until"
                  value={newUntil ? dayjs(newUntil) : null}
                  referenceDate={newFrom ? dayjs(newFrom).endOf(`month`) : undefined}
                  minDate={createUntilMinDate || undefined}
                  onChange={(newValue) => setNewUntil(newValue ? newValue.format(`YYYY-MM-DD`) : ``)}
                  slotProps={{
                    textField: {
                      size: `small`,
                      color: `secondary`,
                      sx: { maxWidth: `100%` },
                    },
                    actionBar: { actions: [ `accept`, `cancel`, `clear` ] },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid
              item
              xs={6}
            >
              <TextField
                select
                size="small"
                label="Cycle"
                value={newCycle}
                onChange={(e) => setNewCycle(e.target.value)}
                sx={{
                  maxWidth: `231px`,
                  width: `100%`,
                }}
              >
                {[1,2,3,4].map(v => (
                  <MenuItem
                    key={v}
                    value={v}
                  >{`${v} week${v>1?`s`:``}`}
                  </MenuItem>
                ))}
              </TextField>

            </Grid>

            <Grid
              item
              xs={6}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  width: `100%`,
                  maxWidth: `231px`,
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => setIsCreateOpen(false)}
                  sx={{
                    flexGrow: 1,
                  }}
                >
                  Cancel
                </Button>

                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  onClick={onSubmitCreate}
                  sx={{
                    flexGrow: 1,
                  }}
                >
                  Create
                </Button>
              </Stack>
            </Grid>

            <Grid
              item
              xs={12}
            />
          </Grid>
        </Box>
      )}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={closeToast}
        anchorOrigin={{
          vertical: `bottom`,
          horizontal: `center`,
        }}
      >
        <Alert
          onClose={closeToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: `100%` }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}


