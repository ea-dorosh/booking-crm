"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useState, useEffect, useMemo } from "react";

export default function DayFormRow({
  timeSlots,
  day,
  employeeAvailability,
  applyEmployeeAvailability,
  deleteEmployeeAvailability,
}) {
  const [startTime, setStartTime] = useState(
    employeeAvailability?.startTimeId || ""
  );
  const [endTime, setEndTime] = useState(employeeAvailability?.endTimeId || "");
  const [isTimeChanged, setIsTimeChanged] = useState(false);

  useEffect(() => {
    setStartTime(employeeAvailability?.startTimeId || "");
    setEndTime(employeeAvailability?.endTimeId || "");
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
    if (!startTime || !endTime || startTime > endTime) {
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
            <MenuItem key={timeSlot.id} value={timeSlot.id}>
              {timeSlot.startTime}
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
            <MenuItem key={timeSlot.id} value={timeSlot.id}>
              {timeSlot.endTime}
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
