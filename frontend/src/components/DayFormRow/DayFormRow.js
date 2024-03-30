import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import dayjs from 'dayjs';
import { useState, useEffect, useMemo } from "react";
import { formattedTime } from '@/utils/formatters';

const timeSlots = [
  { startTime: '08:00:00', endTime: '08:30:00' },
  { startTime: '08:30:00', endTime: '09:00:00' },
  { startTime: '09:00:00', endTime: '09:30:00' },
  { startTime: '09:30:00', endTime: '10:00:00' },
  { startTime: '10:00:00', endTime: '10:30:00' },
  { startTime: '10:30:00', endTime: '11:00:00' },
  { startTime: '11:00:00', endTime: '11:30:00' },
  { startTime: '11:30:00', endTime: '12:00:00' },
  { startTime: '12:00:00', endTime: '12:30:00' },
  { startTime: '12:30:00', endTime: '13:00:00' },
  { startTime: '13:00:00', endTime: '13:30:00' },
  { startTime: '13:30:00', endTime: '14:00:00' },
  { startTime: '14:00:00', endTime: '14:30:00' },
  { startTime: '14:30:00', endTime: '15:00:00' },
  { startTime: '15:00:00', endTime: '15:30:00' },
  { startTime: '15:30:00', endTime: '16:00:00' },
  { startTime: '16:00:00', endTime: '16:30:00' },
  { startTime: '16:30:00', endTime: '17:00:00' },
  { startTime: '17:00:00', endTime: '17:30:00' },
  { startTime: '17:30:00', endTime: '18:00:00' },
  { startTime: '18:00:00', endTime: '18:30:00' },
  { startTime: '18:30:00', endTime: '19:00:00' },
  { startTime: '19:00:00', endTime: '19:30:00' },
  { startTime: '19:30:00', endTime: '20:00:00' },
  { startTime: '20:00:00', endTime: '20:30:00' },
  { startTime: '20:30:00', endTime: '21:00:00' },
];

export default function DayFormRow({
  day,
  employeeAvailability,
  applyEmployeeAvailability,
  deleteEmployeeAvailability,
}) {
  const [startTime, setStartTime] = useState(
    employeeAvailability?.startTime || ''
  );
  const [endTime, setEndTime] = useState(employeeAvailability?.endTime || '');
  const [isTimeChanged, setIsTimeChanged] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setStartTime(employeeAvailability?.startTime || '');
    setEndTime(employeeAvailability?.endTime || '');
    setIsTimeChanged(false);
  }, [employeeAvailability]);

  const handleStartTimeChange = (event) => {
    setStartTime(event.target.value);
    setIsTimeChanged(true);
  };

  const handleEndTimeChange = (event) => {
    setEndTime(event.target.value);
    setIsTimeChanged(true);
  };

  const onDeleteEmployeeAvailability = async () => {
    setStartTime(``);
    setEndTime(``);
    await deleteEmployeeAvailability(employeeAvailability.id);
    setIsEditMode(false);
  };

  const onDiscardChanges = async () => {
    setIsEditMode(false);
  };

  const onApplyEmployeeAvailability = async () => {
    await applyEmployeeAvailability(day.id, startTime, endTime);
    setIsTimeChanged(false);
    setIsEditMode(false);
  };

  const isApplyButtonDisabled = useMemo(() => {
    if (!startTime || !endTime || dayjs(startTime) > dayjs(endTime)) {
      return true;
    }

    return !isTimeChanged;
  }, [isTimeChanged, startTime, endTime]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
      }}
      mb={2}
    >
      <Typography
        sx={{
          width: `100px`,
          flexShrink: 0,
        }}
        variant="caption"
      >
        {day.name}
      </Typography>

      {!employeeAvailability && !isEditMode && <Box sx={{
        display: "flex",
        alignItems: "center",
      }}>
        <Typography
          variant="caption"
          sx={{ width: `120px` }}
        >
          Not working
        </Typography>

        <Button 
          onClick={() => setIsEditMode(true)}
          size="small"
          variant="contained"
          sx={{ width: `148px` }}
        >
          Add
        </Button>
      </Box>}

      {employeeAvailability && !isEditMode && <Box sx={{
        display: "flex",
        alignItems: "center",
      }}>
        <Typography
          variant="caption"
          sx={{ width: `120px` }}
        >
          {formattedTime(employeeAvailability.startTime)} - {formattedTime(employeeAvailability.endTime)}
        </Typography>

        <Button
          onClick={() => setIsEditMode(true)}
          size="small"
          variant="outlined"
          sx={{ 
            width: `64px`,
            marginRight: `20px`
          }}
        >
          Change
        </Button>

        <Button
          onClick={onDeleteEmployeeAvailability}
          size="small"
          variant="outlined"
          sx={{ 
            width: `64px`,
          }}
        >
          Delete
        </Button>
      </Box>}

      {isEditMode && <Box>
        <Box sx={{
          display: "flex",
          alignItems: "center",
        }}>
          <FormControl size="small" sx={{ marginRight: `15px` }}>
            <InputLabel id="start-select-label">From:</InputLabel>

            <Select
              sx={{ width: `90px` }}
              labelId="start-select-label"
              id="start-select"
              value={startTime}
              label="From:"
              onChange={handleStartTimeChange}
              MenuProps={{
                style: {
                  maxHeight: 400,
                },
              }}
            >
              {timeSlots.map((timeSlot) => (
                <MenuItem key={timeSlot.startTime} value={timeSlot.startTime}>
                  { formattedTime(timeSlot.startTime) }
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ marginRight: `20px` }}>
            <InputLabel id="end-select-label">To:</InputLabel>

            <Select
              sx={{ width: `90px` }}
              labelId="end-select-label"
              id="end-select"
              value={endTime}
              label="To:"
              onChange={handleEndTimeChange}
              MenuProps={{
                style: {
                  maxHeight: 400,
                },
              }}
            >
              {timeSlots.map((timeSlot) => (
                <MenuItem key={timeSlot.endTime} value={timeSlot.endTime}>
                  {formattedTime(timeSlot.endTime)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ 
          display: `flex`,
          marginTop: `10px`,
        }}>
          <Button
            sx={{ marginRight: `20px`, width: `90px`}}
            size="small"
            variant="contained"
            onClick={onApplyEmployeeAvailability}
            disabled={Boolean(isApplyButtonDisabled)}
          >
            Apply
          </Button>

          <Button
            sx={{ width: `90px`}}
            size="small"
            variant="outlined"
            onClick={onDiscardChanges}
          >
            Discard
          </Button>
        </Box>
      </Box>}
    </Box>
  );
}
