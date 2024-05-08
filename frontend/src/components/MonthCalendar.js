"use client"

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import {useEffect, useState} from 'react';
import { formattedTime } from '@/utils/formatters';
import 'dayjs/locale/de';

dayjs.locale('de')

async function fakeFetch(date, serviceId, employees) {
  // Construct the URL with query parameters
  const apiUrl = `${process.env.REACT_APP_API_URL}api/protected/calendar?date=${date.format('YYYY-MM-DD')}&serviceId=${serviceId}&employeeIds=${employees.join(',')}`;

  // Fetch data using GET method
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Parse response
  const data = await response.json();

  // Return data
  return { daysToHighlight: data };
}

const initialValue = dayjs(new Date());

function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, onClick, ...other } = props;

  const isSelected =
    !outsideCurrentMonth &&
    highlightedDays.some(({ day: highlightedDay }) =>
      day.format('YYYY-MM-DD') === dayjs(highlightedDay).format('YYYY-MM-DD')
    );

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isSelected ? '🌚' : undefined}
    >
      <PickersDay 
        {...other} 
        outsideCurrentMonth={outsideCurrentMonth} 
        day={day} 
        disabled={!isSelected}
        disableHighlightToday={true}
        onClick={()=>{onClick(day)}}
      />
    </Badge>
  );
}

export default function MonthCalendar({
  service,
  employees,
  setSelectedDay,
  selectedTimeSlot,
  setSelectedTimeSlot,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedDays, setHighlightedDays] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  const fetchHighlightedDays = (date) => {
    fakeFetch(date, service.id, employees)
      .then(({ daysToHighlight }) => {
        setHighlightedDays(daysToHighlight);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    setAvailableTimeSlots([])
    fetchHighlightedDays(initialValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const handleMonthChange = (date) => {
    setIsLoading(true);
    setHighlightedDays([]);
    setAvailableTimeSlots([])
    fetchHighlightedDays(date);
  };

  return (
    <Box>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
        <DateCalendar
          defaultValue={initialValue}
          disablePast
          loading={isLoading}
          onMonthChange={handleMonthChange}
          renderLoading={() => <DayCalendarSkeleton />}
          slots={{
            day: ServerDay,
          }}
          slotProps={{
            day: {
              highlightedDays,
              onClick: (day) => {
                const highlightedDay = highlightedDays.find((highlightedDay) => {
                  return highlightedDay.day === day.format(`YYYY-MM-DD`)
                })

                setAvailableTimeSlots(highlightedDay.availableTimeslots);
                setSelectedDay(highlightedDay);
              },
            },
          }}
          sx={{margin: 0}}
        />
      </LocalizationProvider>

      {!selectedTimeSlot && availableTimeSlots.length > 0 && <Box sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        width: '200px',
        gap: '10px',
      }}>
        {availableTimeSlots.map(slot => (
          <Button 
            key={slot.startTime}
            variant="outlined"
            onClick={() => setSelectedTimeSlot(slot)}
            disabled={slot.disabled}
            sx={{
              backgroundColor: slot.notActive ? `lightgrey` : `initial`,
            }}
          >
            {formattedTime(slot.startTime)}
          </Button>
        ))}
      </Box>}

      {availableTimeSlots.length === 0 && <Box>
        No available time slots
      </Box>}
    </Box>
  );
}