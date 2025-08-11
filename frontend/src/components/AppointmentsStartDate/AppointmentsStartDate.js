import 'dayjs/locale/de';
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
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
      <DatePicker
        label="Start date"
        value={localDate}
        aria-hidden="true"
        slotProps={{
          textField: {
            inputRef: inputRef,
            sx: {
              width: `160px`,
              '& .MuiInputBase-input': {
                padding: `6.75px 10px`,
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
          const formattedDate = localDate.format(`YYYY-MM-DD`);
          onStartDateChange(formattedDate)
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
  );
}
