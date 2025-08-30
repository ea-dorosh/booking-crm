import { Add, ArrowBack, ArrowForward, Delete } from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

import { useEffect, useMemo, useState } from 'react';
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
} from '@/features/employees/employeeSchedulePeriodsSlice';
import { formattedTime } from '@/utils/formatters';

function WeekTabs({
  repeatCycle, activeWeek, onChangeWeek,
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ mb: 1 }}
    >
      {Array.from({ length: repeatCycle }, (_, i) => i + 1).map(week => (
        <Button
          key={week}
          size="small"
          variant={activeWeek === week ? `contained` : `outlined`}
          color="secondary"
          onClick={() => onChangeWeek(week)}
        >
          {`Week ${week}`}
        </Button>
      ))}
    </Stack>
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
  const [dateSuccess, setDateSuccess] = useState(``);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFrom, setNewFrom] = useState(``);
  const [newUntil, setNewUntil] = useState(``);
  const [newCycle, setNewCycle] = useState(1);

  useEffect(() => {
    dispatch(fetchEmployeeSchedulePeriods(employeeId));
  }, [employeeId]);

  useEffect(() => {
    setActiveWeek(1);
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
  const canGoNext = periodIndex < (periods.length - 1);

  const periodTitle = useMemo(() => {
    if (!period) return `No periods`;
    return `${period.validFrom}${period.validUntil ? ` → ${period.validUntil}` : ``}`;
  }, [period]);

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
    const today = new Date();
    const dow = today.getDay(); // 0..6
    const offsetToMonday = (dow + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - offsetToMonday);
    const pad = (n) => String(n).padStart(2, `0`);
    const isoFrom = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;

    setNewFrom(isoFrom);
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
      await dispatch(updateSchedulePeriodDates({
        periodId: period.id,
        body: {
          validFrom: value,
          validUntil: editUntil || period.validUntil,
        },
      })).unwrap();
      setDateError(``);
      setDateSuccess(`Dates saved`);
      setTimeout(() => setDateSuccess(``), 1500);
      dispatch(fetchEmployeeSchedulePeriods(employeeId));
    } catch (e) {
      const msg = typeof e === `string` ? e : (e?.message || JSON.stringify(e));
      setDateError(msg);
      // rollback UI to last valid value
      setEditFrom(period.validFrom);
    }
  };

  const onChangeUntil = async (value) => {
    setEditUntil(value);
    if (!period) return;
    try {
      await dispatch(updateSchedulePeriodDates({
        periodId: period.id,
        body: {
          validFrom: editFrom || period.validFrom,
          validUntil: value,
        },
      })).unwrap();
      setDateError(``);
      setDateSuccess(`Dates saved`);
      setTimeout(() => setDateSuccess(``), 1500);
      dispatch(fetchEmployeeSchedulePeriods(employeeId));
    } catch (e) {
      const msg = typeof e === `string` ? e : (e?.message || JSON.stringify(e));
      setDateError(msg);
      // rollback UI to last valid value
      setEditUntil(period.validUntil);
    }
  };

  const onChangeRepeatCycle = async (value) => {
    await dispatch(updateRepeatCycleThunk({
      periodId: period.id,
      repeatCycle: Number(value),
    }));
    dispatch(fetchEmployeeSchedulePeriods(employeeId));
  };

  const onSubmitCreate = async () => {
    if (!newFrom) return;
    await dispatch(createSchedulePeriod({
      employeeId,
      body: {
        validFrom: newFrom,
        validUntil: newUntil || null,
        repeatCycle: Number(newCycle),
      },
    }));
    setIsCreateOpen(false);
    setTimeout(() => dispatch(fetchEmployeeSchedulePeriods(employeeId)), 200);
  };

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <IconButton
          disabled={!canGoPrev}
          onClick={() => setPeriodIndex(i => Math.max(0, i - 1))}
          color="secondary"
        >
          <ArrowBack />
        </IconButton>

        <Typography
          variant="subtitle2"
          sx={{ flex: 1 }}
        >
          {periodTitle}
        </Typography>

        <IconButton
          disabled={!canGoNext}
          onClick={() => setPeriodIndex(i => Math.min(periods.length - 1, i + 1))}
          color="secondary"
        >
          <ArrowForward />
        </IconButton>

        <Button
          size="small"
          startIcon={<Add />}
          onClick={onCreatePeriod}
          color="secondary"
          variant="contained"
        >
          Add period
        </Button>
      </Stack>

      {period && (
        <>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid
              container
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Grid
                item
                xs={6}
              >
                <DatePicker
                  label="Valid from"
                  value={editFrom ? dayjs(editFrom) : null}
                  onChange={(newValue) => setEditFrom(newValue ? newValue.format(`YYYY-MM-DD`) : ``)}
                  onAccept={(newValue) => newValue && onChangeFrom(newValue.format(`YYYY-MM-DD`))}
                  slotProps={{
                    textField: {
                      size: `small`,
                      color: `secondary`,
                      error: Boolean(dateError),
                      helperText: dateError || undefined,
                      sx: { maxWidth: `100%` },
                    },
                    actionBar: { actions: [ `accept`, `cancel`, `clear` ] },
                  }}
                />
              </Grid>

              <Grid
                item
                xs={6}
              >
                <DatePicker
                  label="Valid until"
                  value={editUntil ? dayjs(editUntil) : null}
                  onChange={(newValue) => setEditUntil(newValue ? newValue.format(`YYYY-MM-DD`) : ``)}
                  onAccept={(newValue) => newValue && onChangeUntil(newValue.format(`YYYY-MM-DD`))}
                  slotProps={{
                    textField: {
                      size: `small`,
                      color: `secondary`,
                      error: Boolean(dateError),
                      sx: { maxWidth: `100%` },
                    },
                    actionBar: { actions: [ `accept`, `cancel`, `clear` ] },
                  }}
                />
              </Grid>

              <Grid
                item
                xs={4}
              >
                <TextField
                  select
                  size="small"
                  label="Cycle"
                  color="secondary"
                  defaultValue={period.repeatCycle}
                  onChange={(e) => onChangeRepeatCycle(e.target.value)}
                  sx={{ maxWidth: `100%` }}
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
                xs={8}
              >
                {dateError && (
                  <Alert
                    severity="error"
                  >
                    {dateError}
                  </Alert>
                )}

                {dateSuccess && !dateError && (
                  <Alert
                    severity="success"
                  >
                    {dateSuccess}
                  </Alert>
                )}
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

      {isCreateOpen && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Create new period</Typography>

          <Grid
            container
            spacing={2}
            sx={{ mt: 1 }}
          >
            <Grid
              item
              xs={6}
            >
              <TextField
                label="Valid from"
                type="date"
                size="small"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: `100%` }}
              />
            </Grid>

            <Grid
              item
              xs={6}
            >
              <TextField
                label="Valid until"
                type="date"
                size="small"
                value={newUntil}
                onChange={(e) => setNewUntil(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: `100%` }}
              />
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
                sx={{ maxWidth: `100%` }}
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
                size="small"
                variant="contained"
                color="secondary"
                onClick={onSubmitCreate}
              >
                Create
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={() => setIsCreateOpen(false)}
                sx={{ marginLeft: 2 }}
              >
                Cancel
              </Button>
            </Grid>

          </Grid>
        </Box>
      )}
    </Box>
  );
}


