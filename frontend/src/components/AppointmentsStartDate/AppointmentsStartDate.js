import 'dayjs/locale/de';
import { Box, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import * as React from 'react';

export default function BasicDatePicker({
  startDate,
  onStartDateChange,
}) {
  const [localDate, setLocalDate] = React.useState(null);
  const inputRef = React.useRef();

  React.useEffect(() => {
    setLocalDate(startDate ? dayjs(startDate) : null);
  }, [startDate]);

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mb: 1,
          display: `block`,
          fontWeight: 600,
          textTransform: `uppercase`,
          letterSpacing: `0.5px`,
        }}
      >
        Start Date
      </Typography>

      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="de"
      >
        <DatePicker
          value={localDate}
          aria-hidden="true"
          slotProps={{
            textField: {
              inputRef: inputRef,
              placeholder: `Select date...`,
              sx: {
                width: `180px`,
                '& .MuiInputBase-input': {
                  padding: `8px 12px`,
                  fontSize: `0.875rem`,
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: `primary.main`,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: `primary.main`,
                    borderWidth: 2,
                  },
                },
              },
            },
            openPickerButton: {
              sx: {
                color: `primary.main`,
                '&:hover': {
                  bgcolor: `primary.50`,
                },
              },
            },
          }}
          onChange={(newValue) => {
            if (newValue) {
              setLocalDate(newValue);
            }
          }}
          onAccept={() => {
            if (localDate) {
              const formattedDate = localDate.format(`YYYY-MM-DD`);
              onStartDateChange(formattedDate);
            }
          }}
          onClose={() => {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.blur();
              }
            }, 0);
          }}
        />
      </LocalizationProvider>
    </Box>
  );
}
