import { Pool } from 'mysql2/promise';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { GroupedAvailabilityDayType } from '@/@types/employeesTypes.js';
import { getEmployeeWorkingTimes } from '@/services/employees/employeesScheduleService.js';
import { getEmployeeAdvanceBookingTime } from '@/services/employees/employeesService.js';

/**
 * Build grouped employee availability for the week of the provided date
 * using schedule periods configuration (FEATURE_FLAGS.employeeSchedulePeriods).
 */
export async function buildGroupedAvailabilityForWeek(
  dbPool: Pool,
  paramDate: Date_ISO_Type,
  employeeIds: number[],
): Promise<GroupedAvailabilityDayType[]> {
  // Parse the ISO date as UTC to avoid local-to-UTC day shifts
  const initialDateObject = dayjs.utc(paramDate);
  const firstDayInPeriod = initialDateObject.startOf(`week`);
  const lastDayInPeriod = initialDateObject.endOf(`week`);

  const groupedByDay: GroupedAvailabilityDayType[] = [];
  let indexDay = firstDayInPeriod;

  while (indexDay.isBefore(lastDayInPeriod) || indexDay.isSame(lastDayInPeriod, `day`)) {
    const dayId = indexDay.day();
    const dateIso = indexDay.format(`YYYY-MM-DD`) as Date_ISO_Type;

    // Load working times for each employee for this exact day
    const employeesForDay: GroupedAvailabilityDayType[`employees`] = [];
    for (const employeeId of employeeIds) {
      const workingTimes = await getEmployeeWorkingTimes(dbPool, employeeId, dateIso);
      if (workingTimes.startTime && workingTimes.endTime) {
        // Get employee advance booking time using dedicated service
        const {
          advanceBookingTime,
          timeslotInterval,
        } = await getEmployeeAdvanceBookingTime(dbPool, employeeId);
        console.log(`timeslotInterval: `, JSON.stringify(timeslotInterval, null, 4));
        employeesForDay.push({
          id: employeeId,
          startTime: workingTimes.startTime,
          endTime: workingTimes.endTime,
          blockStartTimeFirst: workingTimes.blockStartTimeFirst,
          blockEndTimeFirst: workingTimes.blockEndTimeFirst,
          advanceBookingTime,
          timeslotInterval,
        });
      }
    }

    if (employeesForDay.length > 0) {
      groupedByDay.push({
        dayId,
        employees: employeesForDay,
      });
    }

    indexDay = indexDay.add(1, `day`);
  }

  return groupedByDay;
}


/**
 *         "employeeId": 15,
        "startWorkingTimeMs": 1760590800000,
        "endWorkingTimeMs": 1760650200000,
        "pauseTimes": [],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      },
      {
        "employeeId": 16,
        "startWorkingTimeMs": 1760601600000,
        "endWorkingTimeMs": 1760637600000,
        "pauseTimes": [],
        "advanceBookingTime": "00:10:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-17",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760688000000,
        "endWorkingTimeMs": 1760724000000,
        "pauseTimes": [],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 16,
        "startWorkingTimeMs": 1760688000000,
        "endWorkingTimeMs": 1760735340000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760694240000,
            "endPauseTimeMs": 1760697780000
          }
        ],
        "advanceBookingTime": "00:10:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-18",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760770800000,
        "endWorkingTimeMs": 1760815320000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760815200000,
            "endPauseTimeMs": 1760815320000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760770800000,
        "endWorkingTimeMs": 1760822100000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760796300000,
            "endPauseTimeMs": 1760798100000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-19",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760860800000,
        "endWorkingTimeMs": 1760896800000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760862600000,
            "endPauseTimeMs": 1760863200000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760854320000,
        "endWorkingTimeMs": 1760911140000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760879700000,
            "endPauseTimeMs": 1760880900000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      }
    ]
  }
]
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-14',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760418840000,
      endWorkingTimeMs: 1760431860000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760421600000,
      endWorkingTimeMs: 1760479140000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-15',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760509500000,
      endWorkingTimeMs: 1760562300000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 14,
      startWorkingTimeMs: 1760515200000,
      endWorkingTimeMs: 1760544000000,
      pauseTimes: [],
      advanceBookingTime: '00:30:00',
      timeslotInterval: 30
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760504400000,
      endWorkingTimeMs: 1760565540000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760515200000,
      endWorkingTimeMs: 1760558400000,
      pauseTimes: [],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-16',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760596380000,
      endWorkingTimeMs: 1760643840000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760590800000,
      endWorkingTimeMs: 1760650200000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760601600000,
      endWorkingTimeMs: 1760637600000,
      pauseTimes: [],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-17',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760688000000,
      endWorkingTimeMs: 1760724000000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760688000000,
      endWorkingTimeMs: 1760735340000,
      pauseTimes: [Array],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-18',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760770800000,
      endWorkingTimeMs: 1760815320000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760770800000,
      endWorkingTimeMs: 1760822100000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-19',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760860800000,
      endWorkingTimeMs: 1760896800000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760854320000,
      endWorkingTimeMs: 1760911140000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - employeeDatesMap: Map(4) {
  1 => [ undefined, undefined, undefined, undefined, undefined, undefined ],
  15 => [ undefined, undefined, undefined, undefined, undefined ],
  14 => [ undefined ],
  16 => [ undefined, undefined, undefined ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - periodWithDaysAndEmployeeAvailability: [
  {
    "dateISO": "2025-10-14",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760418840000,
        "endWorkingTimeMs": 1760431860000,
        "pauseTimes": [],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760421600000,
        "endWorkingTimeMs": 1760479140000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760444400000,
            "endPauseTimeMs": 1760445600000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-15",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760509500000,
        "endWorkingTimeMs": 1760562300000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760532120000,
            "endPauseTimeMs": 1760536500000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 14,
        "startWorkingTimeMs": 1760515200000,
        "endWorkingTimeMs": 1760544000000,
        "pauseTimes": [],
        "advanceBookingTime": "00:30:00",
        "timeslotInterval": 30
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760504400000,
        "endWorkingTimeMs": 1760565540000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760526300000,
            "endPauseTimeMs": 1760528100000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      },
      {
        "employeeId": 16,
        "startWorkingTimeMs": 1760515200000,
        "endWorkingTimeMs": 1760558400000,
        "pauseTimes": [],
        "advanceBookingTime": "00:10:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-16",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760596380000,
        "endWorkingTimeMs": 1760643840000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760609580000,
            "endPauseTimeMs": 1760613120000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760590800000,
        "endWorkingTimeMs": 1760650200000,
        "pauseTimes": [],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      },
      {
        "employeeId": 16,
        "startWorkingTimeMs": 1760601600000,
        "endWorkingTimeMs": 1760637600000,
        "pauseTimes": [],
        "advanceBookingTime": "00:10:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-17",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760688000000,
        "endWorkingTimeMs": 1760724000000,
        "pauseTimes": [],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 16,
        "startWorkingTimeMs": 1760688000000,
        "endWorkingTimeMs": 1760735340000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760694240000,
            "endPauseTimeMs": 1760697780000
          }
        ],
        "advanceBookingTime": "00:10:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-18",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760770800000,
        "endWorkingTimeMs": 1760815320000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760815200000,
            "endPauseTimeMs": 1760815320000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760770800000,
        "endWorkingTimeMs": 1760822100000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760796300000,
            "endPauseTimeMs": 1760798100000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-19",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760860800000,
        "endWorkingTimeMs": 1760896800000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760862600000,
            "endPauseTimeMs": 1760863200000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760854320000,
        "endWorkingTimeMs": 1760911140000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760879700000,
            "endPauseTimeMs": 1760880900000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      }
    ]
  }
]
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-14',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760418840000,
      endWorkingTimeMs: 1760431860000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760421600000,
      endWorkingTimeMs: 1760479140000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-15',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760509500000,
      endWorkingTimeMs: 1760562300000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 14,
      startWorkingTimeMs: 1760515200000,
      endWorkingTimeMs: 1760544000000,
      pauseTimes: [],
      advanceBookingTime: '00:30:00',
      timeslotInterval: 30
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760504400000,
      endWorkingTimeMs: 1760565540000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760515200000,
      endWorkingTimeMs: 1760558400000,
      pauseTimes: [],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-16',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760596380000,
      endWorkingTimeMs: 1760643840000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760590800000,
      endWorkingTimeMs: 1760650200000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760601600000,
      endWorkingTimeMs: 1760637600000,
      pauseTimes: [],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-17',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760688000000,
      endWorkingTimeMs: 1760724000000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760688000000,
      endWorkingTimeMs: 1760735340000,
      pauseTimes: [Array],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-18',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760770800000,
      endWorkingTimeMs: 1760815320000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760770800000,
      endWorkingTimeMs: 1760822100000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-19',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760860800000,
      endWorkingTimeMs: 1760896800000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760854320000,
      endWorkingTimeMs: 1760911140000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: undefined
🔍 DEBUG: getGoogleCalendarEventsForEmployees - employeeDatesMap: Map(4) {
  1 => [ undefined, undefined, undefined, undefined, undefined, undefined ],
  15 => [ undefined, undefined, undefined, undefined, undefined ],
  14 => [ undefined ],
  16 => [ undefined, undefined, undefined ]
}
No active Google Calendar credentials found for employee ID: 1
No Google Calendar integration found for employee ID: 1
No active Google Calendar credentials found for employee ID: 1
No Google Calendar integration found for employee ID: 1
Retrieved credentials for employee ID: 15, calendarId: egordorosh@gmail.com, errorCount: 0
Creating OAuth2 client with: {
  clientId: '3588167133...',
  hasSecret: true,
  redirectUri: 'http://localhost:3000'
}
Retrieved credentials for employee ID: 15, calendarId: egordorosh@gmail.com, errorCount: 0
Creating OAuth2 client with: {
  clientId: '3588167133...',
  hasSecret: true,
  redirectUri: 'http://localhost:3000'
}
Access token refreshed successfully for employee 15: true
Fetching Google Calendar events for employee 15 for specific dates: {
  calendarId: 'egordorosh@gmail.com',
  requestedDates: [ undefined, undefined, undefined, undefined, undefined ],
  timeMin: '2025-10-14T00:00:00.000Z',
  timeMax: '2025-10-14T23:59:59.999Z'
}
Access token refreshed successfully for employee 15: true
Fetching Google Calendar events for employee 15 for specific dates: {
  calendarId: 'egordorosh@gmail.com',
  requestedDates: [ undefined, undefined, undefined, undefined, undefined ],
  timeMin: '2025-10-14T00:00:00.000Z',
  timeMax: '2025-10-14T23:59:59.999Z'
}
Found 0 events in Google Calendar for employee 15 on requested dates: , , , ,
No active Google Calendar credentials found for employee ID: 14
No Google Calendar integration found for employee ID: 14
No active Google Calendar credentials found for employee ID: 16
No Google Calendar integration found for employee ID: 16
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760444400000, endPauseTimeMs: 1760445600000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760444400000,
    endBlockedTimeMs: 1760445600000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760532120000, endPauseTimeMs: 1760536500000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760532120000,
    endBlockedTimeMs: 1760536500000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760526300000, endPauseTimeMs: 1760528100000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760526300000,
    endBlockedTimeMs: 1760528100000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760609580000, endPauseTimeMs: 1760613120000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760609580000,
    endBlockedTimeMs: 1760613120000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760694240000, endPauseTimeMs: 1760697780000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760694240000,
    endBlockedTimeMs: 1760697780000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760815200000, endPauseTimeMs: 1760815320000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760815200000,
    endBlockedTimeMs: 1760815320000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760796300000, endPauseTimeMs: 1760798100000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760796300000,
    endBlockedTimeMs: 1760798100000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760862600000, endPauseTimeMs: 1760863200000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760862600000,
    endBlockedTimeMs: 1760863200000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760879700000, endPauseTimeMs: 1760880900000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760879700000,
    endBlockedTimeMs: 1760880900000
  }
]
Found 0 events in Google Calendar for employee 15 on requested dates: , , , ,
No active Google Calendar credentials found for employee ID: 14
No Google Calendar integration found for employee ID: 14
No active Google Calendar credentials found for employee ID: 16
No Google Calendar integration found for employee ID: 16
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760444400000, endPauseTimeMs: 1760445600000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760444400000,
    endBlockedTimeMs: 1760445600000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760532120000, endPauseTimeMs: 1760536500000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760532120000,
    endBlockedTimeMs: 1760536500000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760526300000, endPauseTimeMs: 1760528100000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760526300000,
    endBlockedTimeMs: 1760528100000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760609580000, endPauseTimeMs: 1760613120000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760609580000,
    endBlockedTimeMs: 1760613120000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760694240000, endPauseTimeMs: 1760697780000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760694240000,
    endBlockedTimeMs: 1760697780000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760815200000, endPauseTimeMs: 1760815320000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760815200000,
    endBlockedTimeMs: 1760815320000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760796300000, endPauseTimeMs: 1760798100000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760796300000,
    endBlockedTimeMs: 1760798100000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760862600000, endPauseTimeMs: 1760863200000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760862600000,
    endBlockedTimeMs: 1760863200000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760879700000, endPauseTimeMs: 1760880900000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760879700000,
    endBlockedTimeMs: 1760880900000
  }
]
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-14T20:36:15.882Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-14T20:59:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-14T20:36:15.882Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-14T21:29:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-14
  👤 Employee 1 has 0 slots
  👤 Employee 15 has 1 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T06:25:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T11:42:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T13:55:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T20:05:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T15:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 30
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T05:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T05:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T07:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T10:05:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T11:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T15:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T20:59:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T19:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T06:25:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T12:12:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T13:55:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T20:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T15:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 30
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T05:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T06:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T07:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T10:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T11:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T16:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T21:29:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T19:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-15
  👤 Employee 1 has 13 slots
  👤 Employee 14 has 15 slots
  👤 Employee 15 has 46 slots
  👤 Employee 16 has 45 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T06:33:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T09:13:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T11:12:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T18:44:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T05:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T20:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T06:33:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T09:43:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T11:12:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T19:14:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T05:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T21:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T17:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-16
  👤 Employee 1 has 12 slots
  👤 Employee 15 has 63 slots
  👤 Employee 16 has 37 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T08:44:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T10:43:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T20:09:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T17:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T09:14:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T10:43:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T20:39:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-17
  👤 Employee 1 has 10 slots
  👤 Employee 16 has 41 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T07:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T18:20:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T07:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T13:05:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T14:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T20:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T07:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T18:50:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T07:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T13:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T14:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T20:45:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-18
  👤 Employee 1 has 12 slots
  👤 Employee 15 has 48 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T08:40:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T06:12:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T12:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T13:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T20:59:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T08:40:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T17:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T06:12:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T12:45:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T13:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T21:29:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-19
  👤 Employee 1 has 10 slots
  👤 Employee 15 has 54 slots
POST /api/public/calendar?date=2025-10-15 200 809.778 ms - 35823

 */

/**
 * ]
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-14',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760418840000,
      endWorkingTimeMs: 1760431860000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760421600000,
      endWorkingTimeMs: 1760479140000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-14
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-14
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-15',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760509500000,
      endWorkingTimeMs: 1760562300000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 14,
      startWorkingTimeMs: 1760515200000,
      endWorkingTimeMs: 1760544000000,
      pauseTimes: [],
      advanceBookingTime: '00:30:00',
      timeslotInterval: 30
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760504400000,
      endWorkingTimeMs: 1760565540000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760515200000,
      endWorkingTimeMs: 1760558400000,
      pauseTimes: [],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-15
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-15
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-15
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-15
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-16',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760596380000,
      endWorkingTimeMs: 1760643840000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760590800000,
      endWorkingTimeMs: 1760650200000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760601600000,
      endWorkingTimeMs: 1760637600000,
      pauseTimes: [],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-16
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-16
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-16
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-17',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760688000000,
      endWorkingTimeMs: 1760724000000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760688000000,
      endWorkingTimeMs: 1760735340000,
      pauseTimes: [Array],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-17
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-17
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-18',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760770800000,
      endWorkingTimeMs: 1760815320000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760770800000,
      endWorkingTimeMs: 1760822100000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-18
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-18
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-19',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760860800000,
      endWorkingTimeMs: 1760896800000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760854320000,
      endWorkingTimeMs: 1760911140000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-19
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-19
🔍 DEBUG: getGoogleCalendarEventsForEmployees - employeeDatesMap: Map(4) {
  1 => [
    '2025-10-14',
    '2025-10-15',
    '2025-10-16',
    '2025-10-17',
    '2025-10-18',
    '2025-10-19'
  ],
  15 => [
    '2025-10-14',
    '2025-10-15',
    '2025-10-16',
    '2025-10-18',
    '2025-10-19'
  ],
  14 => [ '2025-10-15' ],
  16 => [ '2025-10-15', '2025-10-16', '2025-10-17' ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - periodWithDaysAndEmployeeAvailability: [
  {
    "dateISO": "2025-10-14",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760418840000,
        "endWorkingTimeMs": 1760431860000,
        "pauseTimes": [],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760421600000,
        "endWorkingTimeMs": 1760479140000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760444400000,
            "endPauseTimeMs": 1760445600000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-15",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760509500000,
        "endWorkingTimeMs": 1760562300000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760532120000,
            "endPauseTimeMs": 1760536500000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 14,
        "startWorkingTimeMs": 1760515200000,
        "endWorkingTimeMs": 1760544000000,
        "pauseTimes": [],
        "advanceBookingTime": "00:30:00",
        "timeslotInterval": 30
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760504400000,
        "endWorkingTimeMs": 1760565540000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760526300000,
            "endPauseTimeMs": 1760528100000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      },
      {
        "employeeId": 16,
        "startWorkingTimeMs": 1760515200000,
        "endWorkingTimeMs": 1760558400000,
        "pauseTimes": [],
        "advanceBookingTime": "00:10:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-16",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760596380000,
        "endWorkingTimeMs": 1760643840000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760609580000,
            "endPauseTimeMs": 1760613120000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760590800000,
        "endWorkingTimeMs": 1760650200000,
        "pauseTimes": [],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      },
      {
        "employeeId": 16,
        "startWorkingTimeMs": 1760601600000,
        "endWorkingTimeMs": 1760637600000,
        "pauseTimes": [],
        "advanceBookingTime": "00:10:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-17",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760688000000,
        "endWorkingTimeMs": 1760724000000,
        "pauseTimes": [],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 16,
        "startWorkingTimeMs": 1760688000000,
        "endWorkingTimeMs": 1760735340000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760694240000,
            "endPauseTimeMs": 1760697780000
          }
        ],
        "advanceBookingTime": "00:10:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-18",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760770800000,
        "endWorkingTimeMs": 1760815320000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760815200000,
            "endPauseTimeMs": 1760815320000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760770800000,
        "endWorkingTimeMs": 1760822100000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760796300000,
            "endPauseTimeMs": 1760798100000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      }
    ]
  },
  {
    "dateISO": "2025-10-19",
    "employees": [
      {
        "employeeId": 1,
        "startWorkingTimeMs": 1760860800000,
        "endWorkingTimeMs": 1760896800000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760862600000,
            "endPauseTimeMs": 1760863200000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 60
      },
      {
        "employeeId": 15,
        "startWorkingTimeMs": 1760854320000,
        "endWorkingTimeMs": 1760911140000,
        "pauseTimes": [
          {
            "startPauseTimeMs": 1760879700000,
            "endPauseTimeMs": 1760880900000
          }
        ],
        "advanceBookingTime": "00:00:00",
        "timeslotInterval": 15
      }
    ]
  }
]
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-14',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760418840000,
      endWorkingTimeMs: 1760431860000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760421600000,
      endWorkingTimeMs: 1760479140000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-14
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-14
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-15',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760509500000,
      endWorkingTimeMs: 1760562300000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 14,
      startWorkingTimeMs: 1760515200000,
      endWorkingTimeMs: 1760544000000,
      pauseTimes: [],
      advanceBookingTime: '00:30:00',
      timeslotInterval: 30
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760504400000,
      endWorkingTimeMs: 1760565540000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760515200000,
      endWorkingTimeMs: 1760558400000,
      pauseTimes: [],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-15
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-15
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-15
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-15
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-16',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760596380000,
      endWorkingTimeMs: 1760643840000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760590800000,
      endWorkingTimeMs: 1760650200000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760601600000,
      endWorkingTimeMs: 1760637600000,
      pauseTimes: [],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-16
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-16
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-16
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-17',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760688000000,
      endWorkingTimeMs: 1760724000000,
      pauseTimes: [],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 16,
      startWorkingTimeMs: 1760688000000,
      endWorkingTimeMs: 1760735340000,
      pauseTimes: [Array],
      advanceBookingTime: '00:10:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-17
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-17
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-18',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760770800000,
      endWorkingTimeMs: 1760815320000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760770800000,
      endWorkingTimeMs: 1760822100000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-18
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-18
🔍 DEBUG: getGoogleCalendarEventsForEmployees - dayData: {
  dateISO: '2025-10-19',
  employees: [
    {
      employeeId: 1,
      startWorkingTimeMs: 1760860800000,
      endWorkingTimeMs: 1760896800000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 60
    },
    {
      employeeId: 15,
      startWorkingTimeMs: 1760854320000,
      endWorkingTimeMs: 1760911140000,
      pauseTimes: [Array],
      advanceBookingTime: '00:00:00',
      timeslotInterval: 15
    }
  ]
}
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-19
🔍 DEBUG: getGoogleCalendarEventsForEmployees - pushing dateISO: 2025-10-19
🔍 DEBUG: getGoogleCalendarEventsForEmployees - employeeDatesMap: Map(4) {
  1 => [
    '2025-10-14',
    '2025-10-15',
    '2025-10-16',
    '2025-10-17',
    '2025-10-18',
    '2025-10-19'
  ],
  15 => [
    '2025-10-14',
    '2025-10-15',
    '2025-10-16',
    '2025-10-18',
    '2025-10-19'
  ],
  14 => [ '2025-10-15' ],
  16 => [ '2025-10-15', '2025-10-16', '2025-10-17' ]
}
No active Google Calendar credentials found for employee ID: 1
No Google Calendar integration found for employee ID: 1
No active Google Calendar credentials found for employee ID: 1
No Google Calendar integration found for employee ID: 1
Retrieved credentials for employee ID: 15, calendarId: egordorosh@gmail.com, errorCount: 0
Creating OAuth2 client with: {
  clientId: '3588167133...',
  hasSecret: true,
  redirectUri: 'http://localhost:3000'
}
Retrieved credentials for employee ID: 15, calendarId: egordorosh@gmail.com, errorCount: 0
Creating OAuth2 client with: {
  clientId: '3588167133...',
  hasSecret: true,
  redirectUri: 'http://localhost:3000'
}
Access token refreshed successfully for employee 15: true
Fetching Google Calendar events for employee 15 for specific dates: {
  calendarId: 'egordorosh@gmail.com',
  requestedDates: [
    '2025-10-14',
    '2025-10-15',
    '2025-10-16',
    '2025-10-18',
    '2025-10-19'
  ],
  timeMin: '2025-10-14T00:00:00.000Z',
  timeMax: '2025-10-19T23:59:59.999Z'
}
Access token refreshed successfully for employee 15: true
Fetching Google Calendar events for employee 15 for specific dates: {
  calendarId: 'egordorosh@gmail.com',
  requestedDates: [
    '2025-10-14',
    '2025-10-15',
    '2025-10-16',
    '2025-10-18',
    '2025-10-19'
  ],
  timeMin: '2025-10-14T00:00:00.000Z',
  timeMax: '2025-10-19T23:59:59.999Z'
}
Processing Google Calendar event for requested date: {
  summary: 'test',
  originalStart: '2025-10-14T06:30:00Z',
  originalEnd: '2025-10-14T07:30:00Z'
}
Processing Google Calendar event for requested date: {
  summary: 'Powder Brows Erste Behandlung - Rerew Rwerwe',
  originalStart: '2025-10-14T10:00:00Z',
  originalEnd: '2025-10-14T12:00:00Z'
}
Processing Google Calendar event for requested date: {
  summary: 'test 2',
  originalStart: '2025-10-14T14:15:00Z',
  originalEnd: '2025-10-14T14:45:00Z'
}
Processing Google Calendar event for requested date: {
  summary: 'Powder Brows Nachbehandlung - Fefsd Fsdaf',
  originalStart: '2025-10-15T06:30:00Z',
  originalEnd: '2025-10-15T07:30:00Z'
}
Processing Google Calendar event for requested date: {
  summary: 'test',
  originalStart: '2025-10-16T07:15:00Z',
  originalEnd: '2025-10-16T13:15:00Z'
}
Found 5 events in Google Calendar for employee 15 on requested dates: 2025-10-14, 2025-10-15, 2025-10-16, 2025-10-18, 2025-10-19
No active Google Calendar credentials found for employee ID: 14
No Google Calendar integration found for employee ID: 14
No active Google Calendar credentials found for employee ID: 16
No Google Calendar integration found for employee ID: 16
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760444400000, endPauseTimeMs: 1760445600000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760444400000,
    endBlockedTimeMs: 1760445600000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760532120000, endPauseTimeMs: 1760536500000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760532120000,
    endBlockedTimeMs: 1760536500000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760526300000, endPauseTimeMs: 1760528100000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760526300000,
    endBlockedTimeMs: 1760528100000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760609580000, endPauseTimeMs: 1760613120000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760609580000,
    endBlockedTimeMs: 1760613120000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760694240000, endPauseTimeMs: 1760697780000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760694240000,
    endBlockedTimeMs: 1760697780000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760815200000, endPauseTimeMs: 1760815320000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760815200000,
    endBlockedTimeMs: 1760815320000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760796300000, endPauseTimeMs: 1760798100000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760796300000,
    endBlockedTimeMs: 1760798100000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760862600000, endPauseTimeMs: 1760863200000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760862600000,
    endBlockedTimeMs: 1760863200000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760879700000, endPauseTimeMs: 1760880900000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760879700000,
    endBlockedTimeMs: 1760880900000
  }
]
Processing Google Calendar event for requested date: {
  summary: 'test',
  originalStart: '2025-10-14T06:30:00Z',
  originalEnd: '2025-10-14T07:30:00Z'
}
Processing Google Calendar event for requested date: {
  summary: 'Powder Brows Erste Behandlung - Rerew Rwerwe',
  originalStart: '2025-10-14T10:00:00Z',
  originalEnd: '2025-10-14T12:00:00Z'
}
Processing Google Calendar event for requested date: {
  summary: 'test 2',
  originalStart: '2025-10-14T14:15:00Z',
  originalEnd: '2025-10-14T14:45:00Z'
}
Processing Google Calendar event for requested date: {
  summary: 'Powder Brows Nachbehandlung - Fefsd Fsdaf',
  originalStart: '2025-10-15T06:30:00Z',
  originalEnd: '2025-10-15T07:30:00Z'
}
Processing Google Calendar event for requested date: {
  summary: 'test',
  originalStart: '2025-10-16T07:15:00Z',
  originalEnd: '2025-10-16T13:15:00Z'
}
Found 5 events in Google Calendar for employee 15 on requested dates: 2025-10-14, 2025-10-15, 2025-10-16, 2025-10-18, 2025-10-19
No active Google Calendar credentials found for employee ID: 14
No Google Calendar integration found for employee ID: 14
No active Google Calendar credentials found for employee ID: 16
No Google Calendar integration found for employee ID: 16
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760444400000, endPauseTimeMs: 1760445600000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760444400000,
    endBlockedTimeMs: 1760445600000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760532120000, endPauseTimeMs: 1760536500000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760532120000,
    endBlockedTimeMs: 1760536500000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760526300000, endPauseTimeMs: 1760528100000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760526300000,
    endBlockedTimeMs: 1760528100000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760609580000, endPauseTimeMs: 1760613120000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760609580000,
    endBlockedTimeMs: 1760613120000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: []
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: []
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760694240000, endPauseTimeMs: 1760697780000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760694240000,
    endBlockedTimeMs: 1760697780000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760815200000, endPauseTimeMs: 1760815320000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760815200000,
    endBlockedTimeMs: 1760815320000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760796300000, endPauseTimeMs: 1760798100000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760796300000,
    endBlockedTimeMs: 1760798100000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760862600000, endPauseTimeMs: 1760863200000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760862600000,
    endBlockedTimeMs: 1760863200000
  }
]
🔍 DEBUG: calculateEmployeeDayAvailability - employee.pauseTimes: [ { startPauseTimeMs: 1760879700000, endPauseTimeMs: 1760880900000 } ]
🔍 DEBUG: calculateEmployeeDayAvailability - pauseBlocks: [
  {
    startBlockedTimeMs: 1760879700000,
    endBlockedTimeMs: 1760880900000
  }
]
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-14T08:51:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-14T09:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-14T12:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-14T13:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-14T20:38:20.431Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-14T20:59:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-14T08:51:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-14T09:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-14T12:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-14T13:45:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-14T20:38:20.431Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-14T21:29:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-14
  👤 Employee 1 has 3 slots
  👤 Employee 15 has 1 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T07:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T11:42:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T13:55:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T20:05:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T15:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 30
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T05:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T05:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T07:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T10:05:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T11:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T15:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T20:59:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T19:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T07:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T12:12:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T13:55:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T20:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T15:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 30
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T05:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T06:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T07:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T10:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T11:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T16:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T21:29:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-15T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-15T19:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-15
  👤 Employee 1 has 12 slots
  👤 Employee 14 has 15 slots
  👤 Employee 15 has 46 slots
  👤 Employee 16 has 45 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T13:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T18:44:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T05:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T06:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T13:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T20:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T13:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T06:33:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T06:45:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T13:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T19:14:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T05:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T06:45:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T13:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T21:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-16T13:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-16T17:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-16
  👤 Employee 1 has 6 slots
  👤 Employee 15 has 36 slots
  👤 Employee 16 has 16 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T08:44:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T10:43:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T20:09:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T17:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T09:14:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-17T10:43:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-17T20:39:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-17
  👤 Employee 1 has 10 slots
  👤 Employee 16 has 41 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T07:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T18:20:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T07:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T13:05:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T14:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T20:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T07:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T18:50:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T07:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T13:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-18T14:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-18T20:45:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-18
  👤 Employee 1 has 12 slots
  👤 Employee 15 has 48 slots
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T08:40:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T17:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T06:12:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T12:15:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T13:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T20:59:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T08:00:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T08:40:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T17:30:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 60
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T06:12:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T12:45:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15
🔍 DEBUG: generateTimeSlotsFromRange - minPossibleStartTimeMs: 2025-10-19T13:35:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - maxPossibleStartTimeMs: 2025-10-19T21:29:00.000Z
🔍 DEBUG: generateTimeSlotsFromRange - intervalMinutes: 15

🔍 DEBUG [FEATURE] Combining slots for 2025-10-19
  👤 Employee 1 has 10 slots
  👤 Employee 15 has 54 slots
POST /api/public/calendar?date=2025-10-13 200 924.721 ms - 31326

 */
