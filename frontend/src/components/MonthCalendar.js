"use client"

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale'
import {useEffect, useState} from 'react';
import 'dayjs/locale/de';

dayjs.extend(updateLocale)

dayjs.updateLocale('en', {
  weekStart: 1,
})

dayjs.locale('de')

async function fakeFetch(date) {
  const response = await fetch(`${process.env.REACT_APP_API_URL}api/calendar/${date.format('YYYY-MM-DD')}`);
  const data = await response.json();

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

export default function MonthCalendar() {
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedDays, setHighlightedDays] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  const fetchHighlightedDays = (date) => {
    fakeFetch(date)
      .then(({ daysToHighlight }) => {
        setHighlightedDays(daysToHighlight);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    fetchHighlightedDays(initialValue);
  }, []);

  const handleMonthChange = (date) => {
    setIsLoading(true);
    setHighlightedDays([]);
    fetchHighlightedDays(date);
  };

  return (
    <Box>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                  return highlightedDay.day === day.format('YYYY-MM-DD')
                })

                setAvailableTimeSlots(highlightedDay.availableTimeslots);
              },
            },
          }}
        />
      </LocalizationProvider>

      {availableTimeSlots.length > 0 && <Box>
        {availableTimeSlots.map(slot => (<Box key={slot.timeslotId}>{slot.startTime}</Box>))}
      </Box>}

      {availableTimeSlots.length === 0 && <Box>
        No available time slots
      </Box>}
    </Box>
  );
}