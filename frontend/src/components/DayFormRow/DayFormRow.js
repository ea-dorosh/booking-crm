import {
  Add,
  Delete,
} from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  IconButton,
  Stack,
  Paper,
} from "@mui/material";
import dayjs from 'dayjs';
import { useState, useEffect, useMemo } from "react";
import { formattedTime } from '@/utils/formatters';

const timeSlots = [
  {
    startTime: `08:00:00`,
    endTime: `08:30:00`,
  },
  {
    startTime: `08:30:00`,
    endTime: `09:00:00`,
  },
  {
    startTime: `09:00:00`,
    endTime: `09:30:00`,
  },
  {
    startTime: `09:30:00`,
    endTime: `10:00:00`,
  },
  {
    startTime: `10:00:00`,
    endTime: `10:30:00`,
  },
  {
    startTime: `10:30:00`,
    endTime: `11:00:00`,
  },
  {
    startTime: `11:00:00`,
    endTime: `11:30:00`,
  },
  {
    startTime: `11:30:00`,
    endTime: `12:00:00`,
  },
  {
    startTime: `12:00:00`,
    endTime: `12:30:00`,
  },
  {
    startTime: `12:30:00`,
    endTime: `13:00:00`,
  },
  {
    startTime: `13:00:00`,
    endTime: `13:30:00`,
  },
  {
    startTime: `13:30:00`,
    endTime: `14:00:00`,
  },
  {
    startTime: `14:00:00`,
    endTime: `14:30:00`,
  },
  {
    startTime: `14:30:00`,
    endTime: `15:00:00`,
  },
  {
    startTime: `15:00:00`,
    endTime: `15:30:00`,
  },
  {
    startTime: `15:30:00`,
    endTime: `16:00:00`,
  },
  {
    startTime: `16:00:00`,
    endTime: `16:30:00`,
  },
  {
    startTime: `16:30:00`,
    endTime: `17:00:00`,
  },
  {
    startTime: `17:00:00`,
    endTime: `17:30:00`,
  },
  {
    startTime: `17:30:00`,
    endTime: `18:00:00`,
  },
  {
    startTime: `18:00:00`,
    endTime: `18:30:00`,
  },
  {
    startTime: `18:30:00`,
    endTime: `19:00:00`,
  },
  {
    startTime: `19:00:00`,
    endTime: `19:30:00`,
  },
  {
    startTime: `19:30:00`,
    endTime: `20:00:00`,
  },
  {
    startTime: `20:00:00`,
    endTime: `20:30:00`,
  },
  {
    startTime: `20:30:00`,
    endTime: `21:00:00`,
  },
];

export default function DayFormRow({
  day,
  employeeAvailability,
  applyEmployeeAvailability,
  deleteEmployeeAvailability,
}) {
  const [startTime, setStartTime] = useState(
    employeeAvailability?.startTime || ``,
  );
  const [endTime, setEndTime] = useState(employeeAvailability?.endTime || ``);
  const [isTimeChanged, setIsTimeChanged] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setStartTime(employeeAvailability?.startTime || ``);
    setEndTime(employeeAvailability?.endTime || ``);
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

  if (isEditMode) {
    return (
      <Paper
        sx={{
          padding: 2,
          marginBottom: 1.5,
          backgroundColor: `primary.50`,
          border: `1px solid`,
          borderColor: `primary.200`,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            marginBottom: 1.5,
          }}
        >
          {day.name}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ marginBottom: 1.5 }}
        >
          <FormControl
            size="small"
            sx={{
              minWidth: 80,
              flex: 1,
            }}
          >
            <InputLabel color="secondary">From</InputLabel>

            <Select
              value={startTime}
              label="From"
              onChange={handleStartTimeChange}
              MenuProps={{ style: { maxHeight: 300 } }}
              color="secondary"
            >
              {timeSlots.map((timeSlot) => (
                <MenuItem
                  key={timeSlot.startTime}
                  value={timeSlot.startTime}>
                  {formattedTime(timeSlot.startTime)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{
              minWidth: 80,
              flex: 1,
            }}
          >
            <InputLabel color="secondary">To</InputLabel>

            <Select
              value={endTime}
              label="To"
              onChange={handleEndTimeChange}
              MenuProps={{ style: { maxHeight: 300 } }}
              color="secondary"
            >
              {timeSlots.map((timeSlot) => (
                <MenuItem
                  key={timeSlot.endTime}
                  value={timeSlot.endTime}>
                  {formattedTime(timeSlot.endTime)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
        >

          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={onApplyEmployeeAvailability}
            disabled={Boolean(isApplyButtonDisabled)}
            sx={{
              minWidth: 70,
              flex: 1,
            }}
          >
            Save
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={onDiscardChanges}
            sx={{
              minWidth: 70,
              flex: 1,
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: `flex`,
        alignItems: `center`,
        padding: 1.5,
        paddingBottom: 1.5,
        paddingLeft: 1,
        paddingRight: 1,
        marginBottom: 1,
        backgroundColor: `grey.50`,
        borderRadius: 1,
        border: `1px solid`,
        borderColor: `grey.200`,
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: `flex`,
          alignItems: `center`,
          flexGrow: 1,
          flexShrink: 0,
          gap: 1,
        }}
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

        <Typography
          variant="body2"
          sx={{
            flexShrink: 0,
            color: employeeAvailability ? `text.primary` : `text.secondary`,
            minWidth: 85,
          }}
        >
          {employeeAvailability
            ? `${formattedTime(employeeAvailability.startTime)} - ${formattedTime(employeeAvailability.endTime)}`
            : `Not working`
          }
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          flexGrow: 1,
        }}
      >
        {employeeAvailability ? (
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
              onClick={onDeleteEmployeeAvailability}
              sx={{ padding: `4px` }}
              color="secondary"
            >
              <Delete
                sx={{ fontSize: 16 }} />
            </IconButton>
          </>
        ) : (
          <Button
            size="small"
            variant="contained"
            startIcon={<Add
              sx={{ fontSize: 16 }} />}
            onClick={() => setIsEditMode(true)}
            color="secondary"
            sx={{
              padding: `4px 8px`,
              fontSize: `0.75rem`,
              flex: 1,
            }}
          >
            Add
          </Button>
        )}
      </Stack>
    </Box>
  );
}
