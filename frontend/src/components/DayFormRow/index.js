"use client";

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

  const onDeleteEmployeeAvailability = () => {
    setStartTime("");
    setEndTime("");
    deleteEmployeeAvailability(employeeAvailability.id);
  };

  const onApplyEmployeeAvailability = async () => {
    await applyEmployeeAvailability(day.dayId, startTime, endTime);
    setIsTimeChanged(false);
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
          width: "80px",
        }}
        variant="caption"
      >
        {day.dayName}
      </Typography>

      <FormControl size="small" sx={{ marginRight: `20px` }}>
        <InputLabel id="start-select-label">From:</InputLabel>

        <Select
          sx={{ width: `100px` }}
          labelId="start-select-label"
          id="start-select"
          value={startTime}
          label="From:"
          onChange={handleStartTimeChange}
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
          sx={{ width: `100px` }}
          labelId="end-select-label"
          id="end-select"
          value={endTime}
          label="To:"
          onChange={handleEndTimeChange}
        >
          {timeSlots.map((timeSlot) => (
            <MenuItem key={timeSlot.endTime} value={timeSlot.endTime}>
              {formattedTime(timeSlot.endTime)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <div sx={{ display: `flex` }}>
        <Button
          sx={{ marginRight: `20px` }}
          size="small"
          variant="contained"
          onClick={onApplyEmployeeAvailability}
          disabled={Boolean(isApplyButtonDisabled)}
        >
          Apply
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={onDeleteEmployeeAvailability}
          disabled={!employeeAvailability}
        >
          Discard
        </Button>
      </div>
    </Box>
  );
}
