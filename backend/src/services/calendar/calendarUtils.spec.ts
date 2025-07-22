// Mock date constants
const MOCK_BASE_DATE = `2024-01-15T10:00:00.000Z`; // Winter time (UTC+1)
const MOCK_SUMMER_DATE = `2024-07-15T10:00:00.000Z`; // Summer time (UTC+2)

import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { GroupedAvailabilityDayType } from '@/@types/employeesTypes.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import {
  calculateAdjustedEndTime,
  calculateAvailableTimes,
  getPeriodWithDaysAndEmployeeAvailability,
  combineAndFilterTimeSlotsDataFromTwoServices,
  generateGroupedTimeSlotsForTwoServices,
  DayWithTimeSlots
} from './calendarUtils';

jest.mock(`dayjs`, () => {
  const originalDayjs = jest.requireActual(`dayjs`);

  // Mock date state
  let currentMockDate = MOCK_BASE_DATE;

  // Helper function to set mock date
  const setMockDate = (date: string) => {
    currentMockDate = date;
  };

  // Helper function to reset to default
  const resetMockDate = () => {
    currentMockDate = MOCK_BASE_DATE;
  };

  const mockDayjs = (...args: any[]) => {
    // If the argument is a time string (HH:mm:ss), parse it
    if (args.length > 0 && typeof args[0] === `string` && args[0].match(/^\d{2}:\d{2}:\d{2}$/)) {
      const timeStr = args[0];
      const [hours, minutes, seconds] = timeStr.split(`:`).map(Number);

      // Create a date based on the current mock date with the specified time
      const date = new Date(currentMockDate);
      date.setUTCHours(hours, minutes, seconds, 0);

      return originalDayjs(date);
    }

    // If the argument is an ISO date string, use it directly
    if (args.length > 0 && typeof args[0] === `string` && args[0].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return originalDayjs(args[0]);
    }

    // For all other cases, return the current mock date
    return originalDayjs(currentMockDate);
  };

  // Copy all methods and properties of the original dayjs
  Object.setPrototypeOf(mockDayjs, originalDayjs);
  Object.assign(mockDayjs, originalDayjs);

  // Add helper functions to the mock
  (mockDayjs as any).setMockDate = setMockDate;
  (mockDayjs as any).resetMockDate = resetMockDate;

  return mockDayjs;
});

// All tests below are written to use only MOCK_BASE_DATE and dayjs() without arguments.
// All calculations and expectations are consistent with MOCK_BASE_DATE (2024-01-15T10:00:00.000Z)

describe(`calculateAdjustedEndTime`, () => {
  it(`should correctly subtract service duration from base time`, () => {
    const baseTime = dayjs();
    const result = calculateAdjustedEndTime(baseTime, `01:30:00`);
    expect(result.format(`HH:mm:ss`)).toBe(`07:30:00`);
  });

  it(`should handle edge cases correctly`, () => {
    const baseTime = dayjs();
    const result = calculateAdjustedEndTime(baseTime, `10:00:00`);
    expect(result.format(`HH:mm:ss`)).toBe(`23:00:00`);
  });

  it(`should return UTC time`, () => {
    const baseTime = dayjs();
    const result = calculateAdjustedEndTime(baseTime, `01:00:00`);
    expect(result.format(`Z`)).toBe(`+00:00`);
    expect(result.format(`HH:mm:ss`)).toBe(`08:00:00`);
  });
});

describe(`calculateAvailableTimes`, () => {
  it(`should return available time when no blocked times exist`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(7, `hour`);
    const blockedTimes: any[] = [];
    const serviceDuration = `01:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(1);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`11:00:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`15:00:00`);
  });

  it(`should return empty array when service duration is longer than working time`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(1, `hour`);
    const blockedTimes: any[] = [];
    const serviceDuration = `02:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(0);
  });

  it(`should handle single blocked time in the middle`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(7, `hour`);
    const blockedTimes = [
      {
        startBlockedTime: dayjs().add(2, `hour`),
        endBlockedTime: dayjs().add(3, `hour`),
      },
    ];
    const serviceDuration = `01:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(2);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`11:00:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`10:00:00`);
    expect(result[1].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`14:00:00`);
    expect(result[1].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`15:00:00`);
  });

  it(`should handle multiple blocked times`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(7, `hour`);
    const blockedTimes = [
      { startBlockedTime: dayjs().add(2, `hour`), endBlockedTime: dayjs().add(3, `hour`) },
      { startBlockedTime: dayjs().add(4, `hour`), endBlockedTime: dayjs().add(5, `hour`) },
    ];
    const serviceDuration = `01:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(2);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`11:00:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`10:00:00`);
    expect(result[1].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`16:00:00`);
    expect(result[1].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`15:00:00`);
  });

  it(`should handle blocked time at the beginning`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(7, `hour`);
    const blockedTimes = [
      { startBlockedTime: dayjs(), endBlockedTime: dayjs().add(2, `hour`) },
    ];
    const serviceDuration = `01:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(1);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`13:00:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`15:00:00`);
  });

  it(`should handle blocked time at the end`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(7, `hour`);
    const blockedTimes = [
      { startBlockedTime: dayjs().add(5, `hour`), endBlockedTime: dayjs().add(7, `hour`) },
    ];
    const serviceDuration = `01:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(1);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`11:00:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`13:00:00`);
  });

  it(`should handle overlapping blocked times`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(7, `hour`);
    const blockedTimes = [
      { startBlockedTime: dayjs().add(2, `hour`), endBlockedTime: dayjs().add(4, `hour`) },
      { startBlockedTime: dayjs().add(3, `hour`), endBlockedTime: dayjs().add(5, `hour`) },
    ];
    const serviceDuration = `01:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(2);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`11:00:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`10:00:00`);
    expect(result[1].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`16:00:00`);
    expect(result[1].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`15:00:00`);
  });

  it(`should handle unsorted blocked times`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(7, `hour`);
    const blockedTimes = [
      { startBlockedTime: dayjs().add(4, `hour`), endBlockedTime: dayjs().add(5, `hour`) },
      { startBlockedTime: dayjs().add(2, `hour`), endBlockedTime: dayjs().add(3, `hour`) },
    ];
    const serviceDuration = `01:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(2);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`11:00:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`10:00:00`);
    expect(result[1].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`16:00:00`);
    expect(result[1].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`15:00:00`);
  });

  it(`should handle edge case where adjusted end time equals current time`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(1, `hour`);
    const blockedTimes = [
      { startBlockedTime: dayjs().add(1, `hour`), endBlockedTime: dayjs().add(2, `hour`) },
    ];
    const serviceDuration = `01:00:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(0);
  });

  it(`should handle complex real-world scenario with 10-20 working hours and three different blocked times`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(10, `hour`);
    const blockedTimes = [
      { startBlockedTime: dayjs().add(2, `hour`).add(30, `minute`), endBlockedTime: dayjs().add(3, `hour`).add(45, `minute`) },
      { startBlockedTime: dayjs().add(5, `hour`), endBlockedTime: dayjs().add(7, `hour`).add(30, `minute`) },
      { startBlockedTime: dayjs().add(8, `hour`), endBlockedTime: dayjs().add(9, `hour`).add(15, `minute`) },
    ];
    const serviceDuration = `01:30:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(1);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`11:00:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`10:00:00`);
  });

  it(`should handle non-30-minute blocked intervals correctly`, () => {
    const startWorkingTime = dayjs();
    const endWorkingTime = dayjs().add(8, `hour`);
    const blockedTimes = [
      { startBlockedTime: dayjs().add(30, `minute`), endBlockedTime: dayjs().add(1, `hour`).add(45, `minute`) },
      { startBlockedTime: dayjs().add(4, `hour`).add(15, `minute`), endBlockedTime: dayjs().add(5, `hour`).add(20, `minute`) },
    ];
    const serviceDuration = `00:45:00`;
    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);
    expect(result).toHaveLength(2);
    expect(result[0].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`12:45:00`);
    expect(result[0].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`12:30:00`);
    expect(result[1].minPossibleStartTime.format(`HH:mm:ss`)).toBe(`16:20:00`);
    expect(result[1].maxPossibleStartTime.format(`HH:mm:ss`)).toBe(`16:15:00`);
  });
});

describe(`getPeriodWithDaysAndEmployeeAvailability`, () => {
  beforeEach(() => {
    // Reset to default mock date before each test
    (dayjs as any).resetMockDate();
  });

  it(`should generate a period with employee working times`, () => {
    const initialDate = `2024-01-15` as Date_ISO_Type;
    const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
      {
        dayId: 1, // Monday
        employees: [
          {
            id: 1,
            startTime: `09:00:00`,
            endTime: `17:00:00`,
          },
        ],
      },
    ];
    const result = getPeriodWithDaysAndEmployeeAvailability(initialDate, groupedEmployeeAvailability);
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(`2024-01-15`);
    expect(result[0].employees[0].employeeId).toBe(1);
  });

  it(`should handle empty employee availability`, () => {
    const initialDate = `2024-01-15` as Date_ISO_Type;
    const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [];
    const result = getPeriodWithDaysAndEmployeeAvailability(initialDate, groupedEmployeeAvailability);
    expect(result).toHaveLength(0);
  });

  it(`should handle single day availability`, () => {
    const initialDate = `2024-01-15` as Date_ISO_Type;
    const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
      {
        dayId: 1, // Monday
        employees: [
          {
            id: 1,
            startTime: `10:00:00`,
            endTime: `18:00:00`,
          },
        ],
      },
    ];
    const result = getPeriodWithDaysAndEmployeeAvailability(initialDate, groupedEmployeeAvailability);
    expect(result).toHaveLength(1);
    expect(result[0].employees).toHaveLength(1);
  });

  it(`should convert working times to UTC correctly in winter time`, () => {
    // Winter time: Germany UTC+1, so 08:00 Berlin = 07:00 UTC
    const initialDate = `2024-01-15` as Date_ISO_Type;
    const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
      {
        dayId: 1, // Monday
        employees: [
          {
            id: 1,
            startTime: `08:00:00`,
            endTime: `16:00:00`,
          },
        ],
      },
    ];
    const result = getPeriodWithDaysAndEmployeeAvailability(initialDate, groupedEmployeeAvailability);
    expect(result[0].employees[0].startWorkingTime.format(`HH:mm:ss`)).toBe(`07:00:00`);
    expect(result[0].employees[0].endWorkingTime.format(`HH:mm:ss`)).toBe(`15:00:00`);
  });

  it(`should convert working times to UTC correctly in summer time`, () => {
    // Summer time: Germany UTC+2, so 08:00 Berlin = 06:00 UTC
    (dayjs as any).setMockDate(MOCK_SUMMER_DATE);

    const initialDate = `2024-07-15` as Date_ISO_Type;
    const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
      {
        dayId: 1, // Monday
        employees: [
          {
            id: 1,
            startTime: `08:00:00`,
            endTime: `16:00:00`,
          },
        ],
      },
    ];
    const result = getPeriodWithDaysAndEmployeeAvailability(initialDate, groupedEmployeeAvailability);
    expect(result[0].employees[0].startWorkingTime.format(`HH:mm:ss`)).toBe(`06:00:00`);
    expect(result[0].employees[0].endWorkingTime.format(`HH:mm:ss`)).toBe(`14:00:00`);
  });

  it(`should handle weekend days correctly`, () => {
    const initialDate = `2024-01-20` as Date_ISO_Type; // Saturday
    const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
      {
        dayId: 6, // Saturday
        employees: [
          {
            id: 1,
            startTime: `10:00:00`,
            endTime: `14:00:00`,
          },
        ],
      },
    ];
    const result = getPeriodWithDaysAndEmployeeAvailability(initialDate, groupedEmployeeAvailability);
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(`2024-01-20`);
  });

  it(`should handle weekend days correctly in summer time`, () => {
    // Summer time: Germany UTC+2
    (dayjs as any).setMockDate(MOCK_SUMMER_DATE);

    const initialDate = `2024-07-20` as Date_ISO_Type; // Saturday
    const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
      {
        dayId: 6, // Saturday
        employees: [
          {
            id: 1,
            startTime: `10:00:00`,
            endTime: `14:00:00`,
          },
        ],
      },
    ];
    const result = getPeriodWithDaysAndEmployeeAvailability(initialDate, groupedEmployeeAvailability);
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(`2024-07-20`);
    expect(result[0].employees[0].startWorkingTime.format(`HH:mm:ss`)).toBe(`08:00:00`);
    expect(result[0].employees[0].endWorkingTime.format(`HH:mm:ss`)).toBe(`12:00:00`);
  });

  it(`should handle multiple employees with different and same working days`, () => {
    const initialDate = `2024-01-15` as Date_ISO_Type; // Monday
    const groupedEmployeeAvailability: GroupedAvailabilityDayType[] = [
      {
        dayId: 1, // Monday - both employees work
        employees: [
          {
            id: 1,
            startTime: `09:00:00`,
            endTime: `17:00:00`,
          },
          {
            id: 2,
            startTime: `10:00:00`,
            endTime: `18:00:00`,
          },
        ],
      },
      {
        dayId: 2, // Tuesday - only employee 1 works
        employees: [
          {
            id: 1,
            startTime: `08:00:00`,
            endTime: `16:00:00`,
          },
        ],
      },
      {
        dayId: 3, // Wednesday - only employee 2 works
        employees: [
          {
            id: 2,
            startTime: `11:00:00`,
            endTime: `19:00:00`,
          },
        ],
      },
      {
        dayId: 4, // Thursday - both employees work again
        employees: [
          {
            id: 1,
            startTime: `09:30:00`,
            endTime: `17:30:00`,
          },
          {
            id: 2,
            startTime: `08:30:00`,
            endTime: `16:30:00`,
          },
        ],
      },
    ];
    const result = getPeriodWithDaysAndEmployeeAvailability(initialDate, groupedEmployeeAvailability);

    // Should return 4 days (Monday to Thursday)
    expect(result).toHaveLength(4);

    // Monday - both employees
    expect(result[0].day).toBe(`2024-01-15`);
    expect(result[0].employees).toHaveLength(2);
    expect(result[0].employees[0].employeeId).toBe(1);
    expect(result[0].employees[0].startWorkingTime.format(`HH:mm:ss`)).toBe(`08:00:00`);
    expect(result[0].employees[0].endWorkingTime.format(`HH:mm:ss`)).toBe(`16:00:00`);
    expect(result[0].employees[1].employeeId).toBe(2);
    expect(result[0].employees[1].startWorkingTime.format(`HH:mm:ss`)).toBe(`09:00:00`);
    expect(result[0].employees[1].endWorkingTime.format(`HH:mm:ss`)).toBe(`17:00:00`);

    // Tuesday - only employee 1
    expect(result[1].day).toBe(`2024-01-16`);
    expect(result[1].employees).toHaveLength(1);
    expect(result[1].employees[0].employeeId).toBe(1);
    expect(result[1].employees[0].startWorkingTime.format(`HH:mm:ss`)).toBe(`07:00:00`);
    expect(result[1].employees[0].endWorkingTime.format(`HH:mm:ss`)).toBe(`15:00:00`);

    // Wednesday - only employee 2
    expect(result[2].day).toBe(`2024-01-17`);
    expect(result[2].employees).toHaveLength(1);
    expect(result[2].employees[0].employeeId).toBe(2);
    expect(result[2].employees[0].startWorkingTime.format(`HH:mm:ss`)).toBe(`10:00:00`);
    expect(result[2].employees[0].endWorkingTime.format(`HH:mm:ss`)).toBe(`18:00:00`);

    // Thursday - both employees again
    expect(result[3].day).toBe(`2024-01-18`);
    expect(result[3].employees).toHaveLength(2);
    expect(result[3].employees[0].employeeId).toBe(1);
    expect(result[3].employees[0].startWorkingTime.format(`HH:mm:ss`)).toBe(`08:30:00`);
    expect(result[3].employees[0].endWorkingTime.format(`HH:mm:ss`)).toBe(`16:30:00`);
    expect(result[3].employees[1].employeeId).toBe(2);
    expect(result[3].employees[1].startWorkingTime.format(`HH:mm:ss`)).toBe(`07:30:00`);
    expect(result[3].employees[1].endWorkingTime.format(`HH:mm:ss`)).toBe(`15:30:00`);
  });
});

describe(`combineAndFilterTimeSlotsDataFromTwoServices`, () => {
  it(`should find valid combinations where second service can start right after first service ends`, () => {
    const timeSlotsDataForFirstService: DayWithTimeSlots[] = [
      {
        day: `2025-07-28`,
        serviceDuration: `02:00:00`,
        serviceId: 1,
        employees: [
          {
            employeeId: 14,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T06:00:00.000Z`),
                endTime: dayjs(`2025-07-28T06:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T06:30:00.000Z`),
                endTime: dayjs(`2025-07-28T07:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T07:00:00.000Z`),
                endTime: dayjs(`2025-07-28T07:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T14:00:00.000Z`),
                endTime: dayjs(`2025-07-28T14:30:00.000Z`)
              },
            ]
          },
          {
            employeeId: 1,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T08:00:00.000Z`),
                endTime: dayjs(`2025-07-28T08:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T08:30:00.000Z`),
                endTime: dayjs(`2025-07-28T09:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T09:00:00.000Z`),
                endTime: dayjs(`2025-07-28T09:30:00.000Z`)
              },
            ]
          }
        ]
      }
    ];

    const timeSlotsDataForSecondService: DayWithTimeSlots[] = [
      {
        day: `2025-07-28`,
        serviceDuration: `01:00:00`,
        serviceId: 43,
        employees: [
          {
            employeeId: 14,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T06:00:00.000Z`),
                endTime: dayjs(`2025-07-28T06:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T06:30:00.000Z`),
                endTime: dayjs(`2025-07-28T07:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T07:00:00.000Z`),
                endTime: dayjs(`2025-07-28T07:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T07:30:00.000Z`),
                endTime: dayjs(`2025-07-28T08:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T08:00:00.000Z`),
                endTime: dayjs(`2025-07-28T08:30:00.000Z`)
              },
            ]
          },
          {
            employeeId: 1,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T08:00:00.000Z`),
                endTime: dayjs(`2025-07-28T08:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T08:30:00.000Z`),
                endTime: dayjs(`2025-07-28T09:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T09:00:00.000Z`),
                endTime: dayjs(`2025-07-28T09:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T09:30:00.000Z`),
                endTime: dayjs(`2025-07-28T10:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T10:00:00.000Z`),
                endTime: dayjs(`2025-07-28T10:30:00.000Z`)
              },
            ]
          },
          {
            employeeId: 3,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T10:00:00.000Z`),
                endTime: dayjs(`2025-07-28T10:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T16:00:00.000Z`),
                endTime: dayjs(`2025-07-28T16:30:00.000Z`)
              },
            ]
          },
        ]
      }
    ];

    const result = combineAndFilterTimeSlotsDataFromTwoServices(
      timeSlotsDataForFirstService,
      timeSlotsDataForSecondService
    );

    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(`2025-07-28`);
    expect(result[0].availableTimeSlots).toHaveLength(5);

    expect(result[0].availableTimeSlots[0]).toEqual({
      startTime: `2025-07-28T06:00:00.000Z`,
      endTime: `2025-07-28T06:30:00.000Z`,
      employeeIds: [14],
      secondService: {
        startTime: `2025-07-28T08:00:00.000Z`,
        endTime: `2025-07-28T08:30:00.000Z`,
        employeeIds: [14, 1]
      }
    });

    expect(result[0].availableTimeSlots[1]).toEqual({
      startTime: `2025-07-28T06:30:00.000Z`,
      endTime: `2025-07-28T07:00:00.000Z`,
      employeeIds: [14],
      secondService: {
        startTime: `2025-07-28T08:30:00.000Z`,
        endTime: `2025-07-28T09:00:00.000Z`,
        employeeIds: [1]
      }
    });

    expect(result[0].availableTimeSlots[2]).toEqual({
      startTime: `2025-07-28T07:00:00.000Z`,
      endTime: `2025-07-28T07:30:00.000Z`,
      employeeIds: [14],
      secondService: {
        startTime: `2025-07-28T09:00:00.000Z`,
        endTime: `2025-07-28T09:30:00.000Z`,
        employeeIds: [1]
      }
    });

    expect(result[0].availableTimeSlots[3]).toEqual({
      startTime: `2025-07-28T08:00:00.000Z`,
      endTime: `2025-07-28T08:30:00.000Z`,
      employeeIds: [1],
      secondService: {
        startTime: `2025-07-28T10:00:00.000Z`,
        endTime: `2025-07-28T10:30:00.000Z`,
        employeeIds: [1, 3]
      }
    });

    expect(result[0].availableTimeSlots[4]).toEqual({
      startTime: `2025-07-28T14:00:00.000Z`,
      endTime: `2025-07-28T14:30:00.000Z`,
      employeeIds: [14],
      secondService: {
        startTime: `2025-07-28T16:00:00.000Z`,
        endTime: `2025-07-28T16:30:00.000Z`,
        employeeIds: [3]
      }
    });
  });

  it(`should return empty array when no time slots match between services`, () => {
    const timeSlotsDataForFirstService: DayWithTimeSlots[] = [
      {
        day: `2025-07-28`,
        serviceDuration: `01:00:00`,
        serviceId: 1,
        employees: [
          {
            employeeId: 14,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T06:00:00.000Z`),
                endTime: dayjs(`2025-07-28T06:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T07:00:00.000Z`),
                endTime: dayjs(`2025-07-28T07:30:00.000Z`)
              }
            ]
          }
        ]
      }
    ];

    const timeSlotsDataForSecondService: DayWithTimeSlots[] = [
      {
        day: `2025-07-28`,
        serviceDuration: `01:00:00`,
        serviceId: 43,
        employees: [
          {
            employeeId: 14,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T09:00:00.000Z`),
                endTime: dayjs(`2025-07-28T09:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T10:00:00.000Z`),
                endTime: dayjs(`2025-07-28T10:30:00.000Z`)
              }
            ]
          }
        ]
      }
    ];

    const result = combineAndFilterTimeSlotsDataFromTwoServices(
      timeSlotsDataForFirstService,
      timeSlotsDataForSecondService
    );

    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(`2025-07-28`);
    expect(result[0].availableTimeSlots).toHaveLength(0);
  });

  it(`should handle real world scenario with multiple employees and complex time slots`, () => {
    const timeSlotsDataForFirstService: DayWithTimeSlots[] = [
      {
        day: `2025-07-28`,
        serviceDuration: `02:00:00`,
        serviceId: 1,
        employees: [
          {
            employeeId: 14,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T06:00:00.000Z`),
                endTime: dayjs(`2025-07-28T06:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T06:30:00.000Z`),
                endTime: dayjs(`2025-07-28T07:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T07:00:00.000Z`),
                endTime: dayjs(`2025-07-28T07:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T07:30:00.000Z`),
                endTime: dayjs(`2025-07-28T08:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T08:00:00.000Z`),
                endTime: dayjs(`2025-07-28T08:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T12:00:00.000Z`),
                endTime: dayjs(`2025-07-28T12:30:00.000Z`)
              }
            ]
          },
          {
            employeeId: 1,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T08:00:00.000Z`),
                endTime: dayjs(`2025-07-28T08:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T08:30:00.000Z`),
                endTime: dayjs(`2025-07-28T09:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T09:00:00.000Z`),
                endTime: dayjs(`2025-07-28T09:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T09:30:00.000Z`),
                endTime: dayjs(`2025-07-28T10:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T10:00:00.000Z`),
                endTime: dayjs(`2025-07-28T10:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T10:30:00.000Z`),
                endTime: dayjs(`2025-07-28T11:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T11:00:00.000Z`),
                endTime: dayjs(`2025-07-28T11:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T11:30:00.000Z`),
                endTime: dayjs(`2025-07-28T12:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T12:00:00.000Z`),
                endTime: dayjs(`2025-07-28T12:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T12:30:00.000Z`),
                endTime: dayjs(`2025-07-28T13:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T13:00:00.000Z`),
                endTime: dayjs(`2025-07-28T13:30:00.000Z`)
              }
            ]
          }
        ]
      }
    ];

    const timeSlotsDataForSecondService: DayWithTimeSlots[] = [
      {
        day: `2025-07-28`,
        serviceDuration: `01:00:00`,
        serviceId: 43,
        employees: [
          {
            employeeId: 14,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T06:00:00.000Z`),
                endTime: dayjs(`2025-07-28T06:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T06:30:00.000Z`),
                endTime: dayjs(`2025-07-28T07:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T07:00:00.000Z`),
                endTime: dayjs(`2025-07-28T07:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T07:30:00.000Z`),
                endTime: dayjs(`2025-07-28T08:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T08:00:00.000Z`),
                endTime: dayjs(`2025-07-28T08:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T08:30:00.000Z`),
                endTime: dayjs(`2025-07-28T09:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T09:00:00.000Z`),
                endTime: dayjs(`2025-07-28T09:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T12:00:00.000Z`),
                endTime: dayjs(`2025-07-28T12:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T12:30:00.000Z`),
                endTime: dayjs(`2025-07-28T13:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T13:00:00.000Z`),
                endTime: dayjs(`2025-07-28T13:30:00.000Z`)
              }
            ]
          },
          {
            employeeId: 1,
            availableTimeSlots: [
              {
                startTime: dayjs(`2025-07-28T08:00:00.000Z`),
                endTime: dayjs(`2025-07-28T08:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T08:30:00.000Z`),
                endTime: dayjs(`2025-07-28T09:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T09:00:00.000Z`),
                endTime: dayjs(`2025-07-28T09:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T09:30:00.000Z`),
                endTime: dayjs(`2025-07-28T10:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T10:00:00.000Z`),
                endTime: dayjs(`2025-07-28T10:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T10:30:00.000Z`),
                endTime: dayjs(`2025-07-28T11:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T11:00:00.000Z`),
                endTime: dayjs(`2025-07-28T11:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T11:30:00.000Z`),
                endTime: dayjs(`2025-07-28T12:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T12:00:00.000Z`),
                endTime: dayjs(`2025-07-28T12:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T12:30:00.000Z`),
                endTime: dayjs(`2025-07-28T13:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T13:00:00.000Z`),
                endTime: dayjs(`2025-07-28T13:30:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T13:30:00.000Z`),
                endTime: dayjs(`2025-07-28T14:00:00.000Z`)
              },
              {
                startTime: dayjs(`2025-07-28T14:00:00.000Z`),
                endTime: dayjs(`2025-07-28T14:30:00.000Z`)
              }
            ]
          }
        ]
      }
    ];

    const result = combineAndFilterTimeSlotsDataFromTwoServices(
      timeSlotsDataForFirstService,
      timeSlotsDataForSecondService
    );

    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(`2025-07-28`);
    expect(result[0].availableTimeSlots).toHaveLength(13);

    expect(result[0].availableTimeSlots[0]).toEqual({
      startTime: `2025-07-28T06:00:00.000Z`,
      endTime: `2025-07-28T06:30:00.000Z`,
      employeeIds: [14],
      secondService: {
        startTime: `2025-07-28T08:00:00.000Z`,
        endTime: `2025-07-28T08:30:00.000Z`,
        employeeIds: [14, 1]
      }
    });

    expect(result[0].availableTimeSlots[1]).toEqual({
      startTime: `2025-07-28T06:30:00.000Z`,
      endTime: `2025-07-28T07:00:00.000Z`,
      employeeIds: [14],
      secondService: {
        startTime: `2025-07-28T08:30:00.000Z`,
        endTime: `2025-07-28T09:00:00.000Z`,
        employeeIds: [14, 1]
      }
    });

    expect(result[0].availableTimeSlots[2]).toEqual({
      startTime: `2025-07-28T07:00:00.000Z`,
      endTime: `2025-07-28T07:30:00.000Z`,
      employeeIds: [14],
      secondService: {
        startTime: `2025-07-28T09:00:00.000Z`,
        endTime: `2025-07-28T09:30:00.000Z`,
        employeeIds: [14, 1]
      }
    });

    expect(result[0].availableTimeSlots[3]).toEqual({
      startTime: `2025-07-28T07:30:00.000Z`,
      endTime: `2025-07-28T08:00:00.000Z`,
      employeeIds: [14],
      secondService: {
        startTime: `2025-07-28T09:30:00.000Z`,
        endTime: `2025-07-28T10:00:00.000Z`,
        employeeIds: [1]
      }
    });

    expect(result[0].availableTimeSlots[4]).toEqual({
      startTime: `2025-07-28T08:00:00.000Z`,
      endTime: `2025-07-28T08:30:00.000Z`,
      employeeIds: [14, 1],
      secondService: {
        startTime: `2025-07-28T10:00:00.000Z`,
        endTime: `2025-07-28T10:30:00.000Z`,
        employeeIds: [1]
      }
    });

    expect(result[0].availableTimeSlots[12]).toEqual({
      startTime: `2025-07-28T12:00:00.000Z`,
      endTime: `2025-07-28T12:30:00.000Z`,
      employeeIds: [14, 1],
      secondService: {
        startTime: `2025-07-28T14:00:00.000Z`,
        endTime: `2025-07-28T14:30:00.000Z`,
        employeeIds: [1]
      }
    });

    for (let i = 1; i < result[0].availableTimeSlots.length; i++) {
      expect(result[0].availableTimeSlots[i-1].startTime < result[0].availableTimeSlots[i].startTime)
        .toBe(true);
    }
  });
});

describe(`generateGroupedTimeSlotsForTwoServices`, () => {
  it(`should group time slots by first service start time and combine employee IDs`, () => {
    const filteredTimeSlotsData = [
      {
        day: `2025-07-28` as Date_ISO_Type,
        availableTimeSlots: [
          {
            startTime: `2025-07-28T06:00:00.000Z`, // 08:00 German time (UTC+2)
            endTime: `2025-07-28T06:30:00.000Z`,
            employeeIds: [14],
            secondService: {
              startTime: `2025-07-28T08:00:00.000Z`, // 10:00 German time
              endTime: `2025-07-28T08:30:00.000Z`,
              employeeIds: [14, 1]
            }
          },
          {
            startTime: `2025-07-28T06:00:00.000Z`, // 08:00 German time
            endTime: `2025-07-28T06:30:00.000Z`,
            employeeIds: [1],
            secondService: {
              startTime: `2025-07-28T08:00:00.000Z`, // 10:00 German time
              endTime: `2025-07-28T08:30:00.000Z`,
              employeeIds: [14, 1]
            }
          },
          {
            startTime: `2025-07-28T06:30:00.000Z`, // 08:30 German time
            endTime: `2025-07-28T07:00:00.000Z`,
            employeeIds: [14],
            secondService: {
              startTime: `2025-07-28T08:30:00.000Z`, // 10:30 German time
              endTime: `2025-07-28T09:00:00.000Z`,
              employeeIds: [1]
            }
          }
        ]
      }
    ];

    const result = generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsData);

    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(`2025-07-28`);
    expect(result[0].availableTimeslots).toHaveLength(2);

    expect(result[0].availableTimeslots[0].startTime).toBe(`08:00:00`);
    expect(result[0].availableTimeslots[0].employeeId).toEqual([14, 1]);
    expect(result[0].availableTimeslots[0].secondService).toBeDefined();
    expect(result[0].availableTimeslots[0].secondService!.startTime).toBe(`10:00:00`);
    expect(result[0].availableTimeslots[0].secondService!.employeeIds).toEqual([14, 1]);

    expect(result[0].availableTimeslots[1].startTime).toBe(`08:30:00`);
    expect(result[0].availableTimeslots[1].employeeId).toEqual([14]);
    expect(result[0].availableTimeslots[1].secondService).toBeDefined();
    expect(result[0].availableTimeslots[1].secondService!.startTime).toBe(`10:30:00`);
    expect(result[0].availableTimeslots[1].secondService!.employeeIds).toEqual([1]);
  });

    it(`should handle empty input`, () => {
    const filteredTimeSlotsData: any[] = [];

    const result = generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsData);

    expect(result).toHaveLength(0);
  });

  it(`should handle single time slot without grouping`, () => {
    const filteredTimeSlotsData = [
      {
        day: `2025-07-28` as Date_ISO_Type,
        availableTimeSlots: [
          {
            startTime: `2025-07-28T06:00:00.000Z`, // 08:00 German time
            endTime: `2025-07-28T06:30:00.000Z`,
            employeeIds: [14],
            secondService: {
              startTime: `2025-07-28T08:00:00.000Z`, // 10:00 German time
              endTime: `2025-07-28T08:30:00.000Z`,
              employeeIds: [1]
            }
          }
        ]
      }
    ];

    const result = generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsData);

    expect(result).toHaveLength(1);
    expect(result[0].availableTimeslots).toHaveLength(1);
    expect(result[0].availableTimeslots[0].startTime).toBe(`08:00:00`);
    expect(result[0].availableTimeslots[0].employeeId).toEqual([14]);
    expect(result[0].availableTimeslots[0].secondService).toBeDefined();
    expect(result[0].availableTimeslots[0].secondService!.startTime).toBe(`10:00:00`);
    expect(result[0].availableTimeslots[0].secondService!.employeeIds).toEqual([1]);
  });

  it(`should sort grouped time slots by start time`, () => {
    const filteredTimeSlotsData = [
      {
        day: `2025-07-28` as Date_ISO_Type,
        availableTimeSlots: [
          {
            startTime: `2025-07-28T07:00:00.000Z`, // 09:00 German time
            endTime: `2025-07-28T07:30:00.000Z`,
            employeeIds: [1],
            secondService: {
              startTime: `2025-07-28T09:00:00.000Z`,
              endTime: `2025-07-28T09:30:00.000Z`,
              employeeIds: [1]
            }
          },
          {
            startTime: `2025-07-28T06:00:00.000Z`, // 08:00 German time
            endTime: `2025-07-28T06:30:00.000Z`,
            employeeIds: [14],
            secondService: {
              startTime: `2025-07-28T08:00:00.000Z`,
              endTime: `2025-07-28T08:30:00.000Z`,
              employeeIds: [14]
            }
          }
        ]
      }
    ];

    const result = generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsData);

    expect(result).toHaveLength(1);
    expect(result[0].availableTimeslots).toHaveLength(2);

    expect(result[0].availableTimeslots[0].startTime).toBe(`08:00:00`);
    expect(result[0].availableTimeslots[0].employeeId).toEqual([14]);
    expect(result[0].availableTimeslots[0].secondService).toBeDefined();
    expect(result[0].availableTimeslots[0].secondService!.startTime).toBe(`10:00:00`);
    expect(result[0].availableTimeslots[0].secondService!.employeeIds).toEqual([14]);

    expect(result[0].availableTimeslots[1].startTime).toBe(`09:00:00`);
    expect(result[0].availableTimeslots[1].employeeId).toEqual([1]);
    expect(result[0].availableTimeslots[1].secondService).toBeDefined();
    expect(result[0].availableTimeslots[1].secondService!.startTime).toBe(`11:00:00`);
    expect(result[0].availableTimeslots[1].secondService!.employeeIds).toEqual([1]);

    expect(result[0].availableTimeslots[0].startTime < result[0].availableTimeslots[1].startTime).toBe(true);
  });

  it(`should handle single service data without secondService`, () => {
    const filteredTimeSlotsData = [
      {
        day: `2025-07-28` as Date_ISO_Type,
        availableTimeSlots: [
          {
            startTime: `2025-07-28T06:00:00.000Z`, // 08:00 German time
            endTime: `2025-07-28T06:30:00.000Z`,
            employeeIds: [14],
          },
          {
            startTime: `2025-07-28T06:00:00.000Z`,
            endTime: `2025-07-28T06:30:00.000Z`,
            employeeIds: [1],
          },
          {
            startTime: `2025-07-28T06:30:00.000Z`, // 08:30 German time
            endTime: `2025-07-28T07:00:00.000Z`,
            employeeIds: [14],
          }
        ]
      }
    ];

    const result = generateGroupedTimeSlotsForTwoServices(filteredTimeSlotsData);

    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(`2025-07-28`);
    expect(result[0].availableTimeslots).toHaveLength(2);

    expect(result[0].availableTimeslots[0].startTime).toBe(`08:00:00`);
    expect(result[0].availableTimeslots[0].employeeId).toEqual([14, 1]);
    expect(result[0].availableTimeslots[0].secondService).toBeUndefined();

    expect(result[0].availableTimeslots[1].startTime).toBe(`08:30:00`);
    expect(result[0].availableTimeslots[1].employeeId).toEqual([14]);
    expect(result[0].availableTimeslots[1].secondService).toBeUndefined();
  });
});
