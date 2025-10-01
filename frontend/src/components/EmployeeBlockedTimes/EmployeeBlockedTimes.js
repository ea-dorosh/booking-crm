import { Delete, Edit, Cancel, Save } from '@mui/icons-material';
import 'dayjs/locale/de';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployeeBlockedTimes,
  createEmployeeBlockedTime,
  updateEmployeeBlockedTime,
  deleteEmployeeBlockedTime,
} from '@/features/employees/employeeBlockedTimesSlice';
import {
  showSuccess,
  showError,
} from '@/features/notifications/notificationsSlice';

const generateTimeSlots = () => {
  const slots = [];
  const startHour = 7;
  const endHour = 22;

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${String(hour).padStart(2, `0`)}:${String(minute).padStart(2, `0`)}`;
      if (hour === endHour && minute > 0) break;
      slots.push(timeString);
    }
  }

  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function EmployeeBlockedTimes({ employeeId }) {
  const dispatch = useDispatch();
  const {
    data: blockedTimes,
    isLoading,
    isSaving,
  } = useSelector((state) => state.employeeBlockedTimes);

  // Form state
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [startTime, setStartTime] = useState(`07:00`);
  const [endTime, setEndTime] = useState(`18:00`);
  const [isAllDay, setIsAllDay] = useState(false);

  // Edit mode state
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState(null);
  const [editStartTime, setEditStartTime] = useState(``);
  const [editEndTime, setEditEndTime] = useState(``);
  const [editIsAllDay, setEditIsAllDay] = useState(false);

  useEffect(() => {
    const today = dayjs().format(`YYYY-MM-DD`);
    dispatch(fetchEmployeeBlockedTimes({
      employeeId,
      fromDate: today,
    }));
  }, [employeeId, dispatch]);

  const handleAddBlockedTime = async () => {
    if (!selectedDate) {
      dispatch(showError(`Please select a date`));
      return;
    }

    // Validate time range if not all day
    if (!isAllDay && startTime >= endTime) {
      dispatch(showError(`End time must be after start time`));
      return;
    }

    const payload = {
      blockedDate: selectedDate.format(`YYYY-MM-DD`),
      isAllDay,
      startTime: isAllDay ? null : `${startTime}:00`,
      endTime: isAllDay ? null : `${endTime}:00`,
    };

    const result = await dispatch(createEmployeeBlockedTime({
      employeeId,
      blockedTimeData: payload,
    }));

    if (result.error) {
      dispatch(showError(result.payload || `Failed to add blocked time`));
    } else {
      dispatch(showSuccess(`Blocked time added successfully`));

      // Reset form
      setSelectedDate(dayjs());
      setStartTime(`07:00`);
      setEndTime(`18:00`);
      setIsAllDay(false);

      // Reload blocked times
      const today = dayjs().format(`YYYY-MM-DD`);
      dispatch(fetchEmployeeBlockedTimes({
        employeeId,
        fromDate: today,
      }));
    }
  };

  const handleEditClick = (blockedTime) => {
    setEditingId(blockedTime.id);
    setEditDate(dayjs(blockedTime.blockedDate));
    setEditStartTime(blockedTime.startTime ? blockedTime.startTime.slice(0, 5) : `07:00`);
    setEditEndTime(blockedTime.endTime ? blockedTime.endTime.slice(0, 5) : `18:00`);
    setEditIsAllDay(blockedTime.isAllDay);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDate(null);
    setEditStartTime(``);
    setEditEndTime(``);
    setEditIsAllDay(false);
  };

  const handleSaveEdit = async (blockedTimeId) => {
    // Validate time range if not all day
    if (!editIsAllDay && editStartTime >= editEndTime) {
      dispatch(showError(`End time must be after start time`));
      return;
    }

    const payload = {
      blockedDate: editDate.format(`YYYY-MM-DD`),
      isAllDay: editIsAllDay,
      startTime: editIsAllDay ? null : `${editStartTime}:00`,
      endTime: editIsAllDay ? null : `${editEndTime}:00`,
    };

    const result = await dispatch(updateEmployeeBlockedTime({
      blockedTimeId,
      blockedTimeData: payload,
    }));

    if (result.error) {
      dispatch(showError(result.payload || `Failed to update blocked time`));
    } else {
      dispatch(showSuccess(`Blocked time updated successfully`));
      handleCancelEdit();

      // Reload blocked times
      const today = dayjs().format(`YYYY-MM-DD`);
      dispatch(fetchEmployeeBlockedTimes({
        employeeId,
        fromDate: today,
      }));
    }
  };

  const handleDeleteBlockedTime = async (blockedTimeId) => {
    if (!window.confirm(`Are you sure you want to delete this blocked time?`)) {
      return;
    }

    const result = await dispatch(deleteEmployeeBlockedTime({ blockedTimeId }));

    if (result.error) {
      dispatch(showError(result.payload || `Failed to delete blocked time`));
    } else {
      dispatch(showSuccess(`Blocked time deleted successfully`));

      // Reload blocked times
      const today = dayjs().format(`YYYY-MM-DD`);
      dispatch(fetchEmployeeBlockedTimes({
        employeeId,
        fromDate: today,
      }));
    }
  };

  const formatBlockedTimeDisplay = (blockedTime) => {
    const date = dayjs(blockedTime.blockedDate).format(`DD.MM.YYYY`);

    if (blockedTime.isAllDay) {
      return `${date} - All Day`;
    }

    const start = blockedTime.startTime ? blockedTime.startTime.slice(0, 5) : ``;
    const end = blockedTime.endTime ? blockedTime.endTime.slice(0, 5) : ``;
    return `${date} - ${start} to ${end}`;
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale="de"
    >
      <Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            marginBottom: 1.5,
            fontSize: `1.1rem`,
          }}
        >
          Blocked Times
        </Typography>

        {/* Add New Blocked Time Form */}
        <Card
          variant="outlined"
          sx={{
            marginBottom: 3,
            backgroundColor: `grey.50`,
          }}
        >
          <CardContent>
            <Typography
              variant="subtitle2"
              sx={{
                marginBottom: 2,
                fontWeight: 600,
              }}
            >
              Add New Blocked Time
            </Typography>

            <Stack spacing={2}>
              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                minDate={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: `small`,
                  },
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAllDay}
                    onChange={(event) => setIsAllDay(event.target.checked)}
                  />
                }
                label="Block all day"
              />

              {!isAllDay && (
                <Box
                  sx={{
                    display: `flex`,
                    gap: 2,
                  }}
                >
                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel>Start Time</InputLabel>
                    <Select
                      value={startTime}
                      label="Start Time"
                      onChange={(event) => setStartTime(event.target.value)}
                    >
                      {TIME_SLOTS.map((slot) => (
                        <MenuItem
                          key={`start-${slot}`}
                          value={slot}
                        >
                          {slot}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel>End Time</InputLabel>
                    <Select
                      value={endTime}
                      label="End Time"
                      onChange={(event) => setEndTime(event.target.value)}
                    >
                      {TIME_SLOTS.map((slot) => (
                        <MenuItem
                          key={`end-${slot}`}
                          value={slot}
                        >
                          {slot}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              <Button
                variant="contained"
                onClick={handleAddBlockedTime}
                disabled={isSaving || !selectedDate}
                fullWidth
              >
                {isSaving ? <CircularProgress size={24} /> : `Add Blocked Time`}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* List of Blocked Times */}
        <Typography
          variant="subtitle2"
          sx={{
            marginBottom: 1,
            fontWeight: 600,
          }}
        >
          Upcoming Blocked Times
        </Typography>

        {isLoading ? (
          <Box
            sx={{
              display: `flex`,
              justifyContent: `center`,
              padding: 3,
            }}
          >
            <CircularProgress />
          </Box>
        ) : blockedTimes.length === 0 ? (
          <Box
            sx={{
              textAlign: `center`,
              padding: 3,
              color: `text.secondary`,
              backgroundColor: `grey.50`,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">No blocked times scheduled</Typography>
          </Box>
        ) : (
          <List sx={{ padding: 0 }}>
            {blockedTimes.map((blockedTime) => (
              <Card
                key={blockedTime.id}
                variant="outlined"
                sx={{ marginBottom: 1 }}
              >
                <ListItem
                  sx={{
                    display: `flex`,
                    flexDirection: `column`,
                    alignItems: `stretch`,
                    padding: 2,
                  }}
                >
                  {editingId === blockedTime.id ? (
                    // Edit Mode
                    <Stack
                      spacing={2}
                      sx={{ width: `100%` }}
                    >
                      <DatePicker
                        label="Date"
                        value={editDate}
                        onChange={(newValue) => setEditDate(newValue)}
                        minDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: `small`,
                          },
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editIsAllDay}
                            onChange={(event) => setEditIsAllDay(event.target.checked)}
                          />
                        }
                        label="Block all day"
                      />

                      {!editIsAllDay && (
                        <Box
                          sx={{
                            display: `flex`,
                            gap: 2,
                          }}
                        >
                          <FormControl
                            fullWidth
                            size="small"
                          >
                            <InputLabel>Start Time</InputLabel>
                            <Select
                              value={editStartTime}
                              label="Start Time"
                              onChange={(event) => setEditStartTime(event.target.value)}
                            >
                              {TIME_SLOTS.map((slot) => (
                                <MenuItem
                                  key={`edit-start-${slot}`}
                                  value={slot}
                                >
                                  {slot}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl
                            fullWidth
                            size="small"
                          >
                            <InputLabel>End Time</InputLabel>
                            <Select
                              value={editEndTime}
                              label="End Time"
                              onChange={(event) => setEditEndTime(event.target.value)}
                            >
                              {TIME_SLOTS.map((slot) => (
                                <MenuItem
                                  key={`edit-end-${slot}`}
                                  value={slot}
                                >
                                  {slot}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}

                      <Box
                        sx={{
                          display: `flex`,
                          gap: 1,
                          justifyContent: `flex-end`,
                        }}
                      >
                        <Button
                          size="small"
                          startIcon={<Cancel />}
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Save />}
                          onClick={() => handleSaveEdit(blockedTime.id)}
                          disabled={isSaving}
                        >
                          Save
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    // View Mode
                    <>
                      <Box
                        sx={{
                          display: `flex`,
                          justifyContent: `space-between`,
                          alignItems: `center`,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 500 }}
                          >
                            {formatBlockedTimeDisplay(blockedTime)}
                          </Typography>
                          {blockedTime.isAllDay && (
                            <Chip
                              label="All Day"
                              size="small"
                              color="primary"
                              sx={{ marginTop: 0.5 }}
                            />
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: `flex`,
                            gap: 0.5,
                          }}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(blockedTime)}
                            disabled={isSaving}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteBlockedTime(blockedTime.id)}
                            disabled={isSaving}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </>
                  )}
                </ListItem>
              </Card>
            ))}
          </List>
        )}
      </Box>
    </LocalizationProvider>
  );
}
