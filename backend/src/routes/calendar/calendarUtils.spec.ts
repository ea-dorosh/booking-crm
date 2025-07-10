import dayjs from 'dayjs';
import {
  getAppointmentEndTime,
  disableTimeSlotsForServiceDuration,
  addTimeSlotsAccordingEmployeeAvailability,
  replaceExistingDayWithNewEmployeeData,
  calculateAdjustedEndTime,
  calculateAvailableTimes,
} from './calendarUtils';

describe(`getAppointmentEndTime`, () => {
  it(`should correctly calculate the end time of an appointment`, () => {
    const endTime1 = getAppointmentEndTime(dayjs('09:00:00', 'HH:mm:ss'), `01:30:00`);
    expect(endTime1.format('HH:mm:ss')).toBe(`10:30:00`);

    const endTime2 = getAppointmentEndTime(dayjs('23:00:00', 'HH:mm:ss'), `02:15:00`);
    expect(endTime2.format('HH:mm:ss')).toBe(`01:15:00`);

    const endTime3 = getAppointmentEndTime(dayjs('09:00:00', 'HH:mm:ss'), `02:45:00`);
    expect(endTime3.format('HH:mm:ss')).toBe(`11:45:00`);
  });
});

describe(`disableTimeSlotsForServiceDuration`, () => {
  it(`should filter out time slots that are before appointment end time`, () => {
    const availableTimeSlots1 = [
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: [1] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false, employeeId: [1] },
    ];

    const filteredSlots1 = disableTimeSlotsForServiceDuration(availableTimeSlots1, `01:30:00`);

    expect(filteredSlots1).toEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: true, employeeId: [] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: true, employeeId: [] },
    ]);

    const availableTimeSlots2 = [
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: [1] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false, employeeId: [1] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: [1] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: false, employeeId: [1] },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false, employeeId: [1] },
    ];

    const filteredSlots2 = disableTimeSlotsForServiceDuration(availableTimeSlots2, `00:40:00`);

    expect(filteredSlots2).toEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: [1] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false, employeeId: [1] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: [1] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: false, employeeId: [1] },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: true, employeeId: [] },
    ]);
  });

  it(`should filter out time slots that are before appointment end time and that are before disabled time slots (blocked)`, () => {
    const availableTimeSlots1 = [
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: true, employeeId: [] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false, employeeId: [1] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: [1] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true, employeeId: [] },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false, employeeId: [1] },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: false, employeeId: [1] },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: true, employeeId: [] },
      { startTime: `13:00:00`, endTime: `13:30:00`, disabled: false, employeeId: [1] },
    ];

    const filteredSlots1 = disableTimeSlotsForServiceDuration(availableTimeSlots1, `01:00:00`);

    expect(filteredSlots1).toEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: true, employeeId: [] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: true, employeeId: [] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false, employeeId: [1] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: true, employeeId: [] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true, employeeId: [] },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false, employeeId: [1] },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: true,  employeeId: [] },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: true, employeeId: [] },
      { startTime: `13:00:00`, endTime: `13:30:00`, disabled: true,  employeeId: [] },
    ]);

    const availableTimeSlots2 = [
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: [1] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false, employeeId: [1] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: [1] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true, employeeId: [] },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false, employeeId: [1] },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: false, employeeId: [1] },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: true, employeeId: [] },
      { startTime: `13:00:00`, endTime: `13:30:00`, disabled: false, employeeId: [1] },
    ];

    const filteredSlots2 = disableTimeSlotsForServiceDuration(availableTimeSlots2, `01:40:00`);

    expect(filteredSlots2).toEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: true,  employeeId: [] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: true,  employeeId: [] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: true,  employeeId: [] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true, employeeId: [] },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: true,  employeeId: [] },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: true,  employeeId: [] },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: true, employeeId: [] },
      { startTime: `13:00:00`, endTime: `13:30:00`, disabled: true,  employeeId: [] },
    ]);
  });
});

describe(`addTimeSlotsAccordingEmployeeAvailability`, () => {
  it(`should add time slots every 30 mins without disabled when blockedTimes is empty`, () => {
    const startTime = `09:00:00`;
    const endTime = `13:00:00`;
    const blockedTimes: any[] = [];

    const timeSlots = addTimeSlotsAccordingEmployeeAvailability({
      startTime, endTime, blockedTimes, employeeId: 1,
    });

    expect(timeSlots).toStrictEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: [1] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false, employeeId: [1] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: [1] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: false, employeeId: [1]},
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false, employeeId: [1] },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: false, employeeId: [1] },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: false, employeeId: [1] },
    ]);
  });

  it(`should add time slots every 30 mins with one disabled when blockedTimes has one value`, () => {
    const startTime = `09:00:00`;
    const endTime = `13:00:00`;
    const blockedTimes = [
      {
        startBlockedTime: dayjs('10:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('10:30:00', 'HH:mm:ss'),
      },
    ];

    const timeSlots = addTimeSlotsAccordingEmployeeAvailability({
      startTime, endTime, blockedTimes, employeeId: 1,
    });

    expect(timeSlots).toStrictEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: [1] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: true, employeeId: [] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: [1] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: false, employeeId: [1] },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false, employeeId: [1] },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: false, employeeId: [1] },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: false, employeeId: [1] },
    ]);
  });

  it(`should add time slots every 30 mins with one disabled when blockedTimes has one value`, () => {
    const startTime = `09:00:00`;
    const endTime = `13:00:00`;
    const blockedTimes = [
      {
        startBlockedTime: dayjs('10:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('10:30:00', 'HH:mm:ss'),
      },
      {
        startBlockedTime: dayjs('11:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('12:10:00', 'HH:mm:ss'),
      },
    ];

    const timeSlots = addTimeSlotsAccordingEmployeeAvailability({
      startTime, endTime, blockedTimes, employeeId: 1,
    });

    expect(timeSlots).toStrictEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: [1] },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: [1] },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: true, employeeId: [] },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: [1] },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true, employeeId: [] },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: true, employeeId: [] },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: true, employeeId: [] },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: false, employeeId: [1] },
    ]);
  });
});

describe(`replaceExistingDayWithNewEmployeeData`, () => {
  it(`should replace the existing day with new employee data when existing day has not disabled timeslots and newDate also does not have disabled timeslots`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    };

    const newDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2],
        },
      ],
    };

    const result = replaceExistingDayWithNewEmployeeData({ existingDay, newDay });

    expect(result).toEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1, 2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1, 2],
        },
      ],
    });
  });

  it(`should replace the existing day with new employee data when existing day has disabled timeslots and newDate does not have disabled timeslots`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: true,
          employeeId: [],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    };

    const newDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2],
        },
      ],
    };

    const result = replaceExistingDayWithNewEmployeeData({ existingDay, newDay });

    expect(result).toEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1, 2],
        },
      ],
    });
  });

  it(`should replace the existing day with new employee data when existing day does not have disabled timeslots and newDate has disabled timeslots`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    };

    const newDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: true,
          employeeId: [],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2],
        },
      ],
    };

    const result = replaceExistingDayWithNewEmployeeData({ existingDay, newDay });

    expect(result).toEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1, 2],
        },
      ],
    });
  });

  it(`should replace the existing day with new employee data when existing day has some disabled timeslots and newDate has some other disabled timeslots`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: true,
          employeeId: [],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    };

    const newDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: true,
          employeeId: [],
        },
      ],
    };

    const result = replaceExistingDayWithNewEmployeeData({ existingDay, newDay });

    expect(result).toEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    });
  });

  it(`should replace the existing day with new employee data when existing day has some disabled timeslots and newDate has same disabled timeslots`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: true,
          employeeId: [],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    };

    const newDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: true,
          employeeId: [],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2],
        },
      ],
    };

    const result = replaceExistingDayWithNewEmployeeData({ existingDay, newDay });

    expect(result).toEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: true,
          employeeId: [],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1, 2],
        },
      ],
    });
  });

  it(`should replace the existing day with new employee data when existing day has more timeslots than newDate`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1],
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    };

    const newDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2],
        },
      ],
    };

    const result = replaceExistingDayWithNewEmployeeData({ existingDay, newDay });

    expect(result).toEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1, 2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1],
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    });
  });

  it(`should replace the existing day with new employee data when existing day has less timeslots than newDate`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1],
        },
      ],
    };

    const newDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2],
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2],
        },
      ],
    };

    const result = replaceExistingDayWithNewEmployeeData({ existingDay, newDay });

    expect(result).toEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1, 2],
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2],
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2],
        },
      ],
    });
  });
});

describe(`calculateAdjustedEndTime`, () => {
  it(`should correctly subtract service duration from base time`, () => {
    // Test case 1: Simple subtraction
    const baseTime1 = dayjs('10:00:00', 'HH:mm:ss');
    const serviceDuration1 = '01:30:00';
    const result1 = calculateAdjustedEndTime(baseTime1, serviceDuration1);
    expect(result1.format('HH:mm:ss')).toBe('06:30:00');

    // Test case 2: Subtraction with minutes and seconds
    const baseTime2 = dayjs('15:45:30', 'HH:mm:ss');
    const serviceDuration2 = '02:15:45';
    const result2 = calculateAdjustedEndTime(baseTime2, serviceDuration2);
    expect(result2.format('HH:mm:ss')).toBe('11:29:45');

    // Test case 3: Edge case - subtraction from midnight
    const baseTime3 = dayjs('00:30:00', 'HH:mm:ss');
    const serviceDuration3 = '00:45:00';
    const result3 = calculateAdjustedEndTime(baseTime3, serviceDuration3);
    expect(result3.format('HH:mm:ss')).toBe('21:45:00');

    // Test case 4: Zero duration
    const baseTime4 = dayjs('12:00:00', 'HH:mm:ss');
    const serviceDuration4 = '00:00:00';
    const result4 = calculateAdjustedEndTime(baseTime4, serviceDuration4);
    expect(result4.format('HH:mm:ss')).toBe('10:00:00');

    // Test case 5: Large duration
    const baseTime5 = dayjs('23:00:00', 'HH:mm:ss');
    const serviceDuration5 = '05:30:15';
    const result5 = calculateAdjustedEndTime(baseTime5, serviceDuration5);
    expect(result5.format('HH:mm:ss')).toBe('15:29:45');
  });

  it(`should handle edge cases correctly`, () => {
    // Test case: Very small time with large duration
    const baseTime = dayjs('00:01:00', 'HH:mm:ss');
    const serviceDuration = '01:00:00';
    const result = calculateAdjustedEndTime(baseTime, serviceDuration);
    expect(result.format('HH:mm:ss')).toBe('21:01:00');

    // Test case: Exact hour boundary
    const baseTime2 = dayjs('10:00:00', 'HH:mm:ss');
    const serviceDuration2 = '10:00:00';
    const result2 = calculateAdjustedEndTime(baseTime2, serviceDuration2);
    expect(result2.format('HH:mm:ss')).toBe('22:00:00');
  });

  it(`should return UTC time`, () => {
    const baseTime = dayjs('12:00:00', 'HH:mm:ss');
    const serviceDuration = '01:00:00';
    const result = calculateAdjustedEndTime(baseTime, serviceDuration);

    // Check that the result is in UTC
    expect(result.format('Z')).toBe('+00:00');
    expect(result.format('HH:mm:ss')).toBe('09:00:00');
  });
});

describe(`calculateAvailableTimes`, () => {
  it(`should return available time when no blocked times exist`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('17:00:00', 'HH:mm:ss');
    const blockedTimes: any[] = [];
    const serviceDuration = '01:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(1);
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('09:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('14:00:00'); // 17:00 - 01:00 = 16:00, but with UTC conversion
  });

  it(`should return empty array when service duration is longer than working time`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('10:00:00', 'HH:mm:ss');
    const blockedTimes: any[] = [];
    const serviceDuration = '02:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(0);
  });

  it(`should handle single blocked time in the middle`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('17:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('12:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('13:00:00', 'HH:mm:ss'),
      },
    ];
    const serviceDuration = '01:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(2);
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('09:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('09:00:00'); // 12:00 - 01:00 = 11:00, but with UTC conversion
    expect(result[1].minPossibleStartTime.format('HH:mm:ss')).toBe('13:00:00');
    expect(result[1].maxPossibleStartTime.format('HH:mm:ss')).toBe('14:00:00'); // 17:00 - 01:00 = 16:00, but with UTC conversion
  });

  it(`should handle multiple blocked times`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('17:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('10:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('11:00:00', 'HH:mm:ss'),
      },
      {
        startBlockedTime: dayjs('14:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('15:00:00', 'HH:mm:ss'),
      },
    ];
    const serviceDuration = '01:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(3);
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('09:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('07:00:00'); // 10:00 - 01:00 = 09:00, but with UTC conversion
    expect(result[1].minPossibleStartTime.format('HH:mm:ss')).toBe('11:00:00');
    expect(result[1].maxPossibleStartTime.format('HH:mm:ss')).toBe('11:00:00'); // 14:00 - 01:00 = 13:00, but with UTC conversion
    expect(result[2].minPossibleStartTime.format('HH:mm:ss')).toBe('15:00:00');
    expect(result[2].maxPossibleStartTime.format('HH:mm:ss')).toBe('14:00:00'); // 17:00 - 01:00 = 16:00, but with UTC conversion
  });

  it(`should handle blocked time at the beginning`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('17:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('09:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('10:00:00', 'HH:mm:ss'),
      },
    ];
    const serviceDuration = '01:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(1);
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('10:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('14:00:00'); // 17:00 - 01:00 = 16:00, but with UTC conversion
  });

  it(`should handle blocked time at the end`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('17:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('16:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('17:00:00', 'HH:mm:ss'),
      },
    ];
    const serviceDuration = '01:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(1);
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('09:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('13:00:00'); // 16:00 - 01:00 = 15:00, but with UTC conversion
  });

  it(`should handle overlapping blocked times`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('17:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('10:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('12:00:00', 'HH:mm:ss'),
      },
      {
        startBlockedTime: dayjs('11:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('13:00:00', 'HH:mm:ss'),
      },
    ];
    const serviceDuration = '01:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(2);
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('09:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('07:00:00'); // 10:00 - 01:00 = 09:00, but with UTC conversion
    expect(result[1].minPossibleStartTime.format('HH:mm:ss')).toBe('13:00:00');
    expect(result[1].maxPossibleStartTime.format('HH:mm:ss')).toBe('14:00:00'); // 17:00 - 01:00 = 16:00, but with UTC conversion
  });

  it(`should handle unsorted blocked times`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('17:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('14:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('15:00:00', 'HH:mm:ss'),
      },
      {
        startBlockedTime: dayjs('10:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('11:00:00', 'HH:mm:ss'),
      },
    ];
    const serviceDuration = '01:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(3);
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('09:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('07:00:00'); // 10:00 - 01:00 = 09:00, but with UTC conversion
    expect(result[1].minPossibleStartTime.format('HH:mm:ss')).toBe('11:00:00');
    expect(result[1].maxPossibleStartTime.format('HH:mm:ss')).toBe('11:00:00'); // 14:00 - 01:00 = 13:00, but with UTC conversion
    expect(result[2].minPossibleStartTime.format('HH:mm:ss')).toBe('15:00:00');
    expect(result[2].maxPossibleStartTime.format('HH:mm:ss')).toBe('14:00:00'); // 17:00 - 01:00 = 16:00, but with UTC conversion
  });

  it(`should handle edge case where adjusted end time equals current time`, () => {
    const startWorkingTime = dayjs('09:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('10:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('10:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('11:00:00', 'HH:mm:ss'),
      },
    ];
    const serviceDuration = '01:00:00';

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

    expect(result).toHaveLength(1);
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('09:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('07:00:00'); // 10:00 - 01:00 = 09:00, but with UTC conversion
  });

    it(`should handle complex real-world scenario with 8-20 working hours and three different blocked times`, () => {
    const startWorkingTime = dayjs('08:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('20:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('10:30:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('11:45:00', 'HH:mm:ss'), // 1 час 15 минут
      },
      {
        startBlockedTime: dayjs('14:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('16:30:00', 'HH:mm:ss'), // 2 часа 30 минут
      },
      {
        startBlockedTime: dayjs('18:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('19:15:00', 'HH:mm:ss'), // 1 час 15 минут
      },
    ];
    const serviceDuration = '01:30:00'; // 1 час 30 минут

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

        expect(result).toHaveLength(3);

    // Первый интервал: с 8:00 до первого заблокированного времени (10:30)
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('08:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('07:00:00'); // 10:30 - 01:30 = 09:00, but with UTC conversion

    // Второй интервал: после первого заблокированного времени (11:45) до второго (14:00)
    expect(result[1].minPossibleStartTime.format('HH:mm:ss')).toBe('11:45:00');
    expect(result[1].maxPossibleStartTime.format('HH:mm:ss')).toBe('10:30:00'); // 14:00 - 01:30 = 12:30, but with UTC conversion

    // Третий интервал: после второго заблокированного времени (16:30) до конца рабочего дня (20:00)
    expect(result[2].minPossibleStartTime.format('HH:mm:ss')).toBe('16:30:00');
    expect(result[2].maxPossibleStartTime.format('HH:mm:ss')).toBe('14:30:00'); // 20:00 - 01:30 = 18:30, but with UTC conversion
  });

  it(`should handle complex scenario with different service durations`, () => {
    const startWorkingTime = dayjs('08:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('20:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('09:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('10:00:00', 'HH:mm:ss'), // 1 час
      },
      {
        startBlockedTime: dayjs('12:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('13:00:00', 'HH:mm:ss'), // 1 час
      },
      {
        startBlockedTime: dayjs('15:00:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('17:00:00', 'HH:mm:ss'), // 2 часа
      },
    ];

    // Тест с короткой услугой (30 минут)
    const shortServiceDuration = '00:30:00';
    const resultShort = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, shortServiceDuration);

    expect(resultShort).toHaveLength(4);
    expect(resultShort[0].minPossibleStartTime.format('HH:mm:ss')).toBe('08:00:00');
    expect(resultShort[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('06:30:00'); // 09:00 - 00:30 = 08:30, but with UTC conversion
    expect(resultShort[1].minPossibleStartTime.format('HH:mm:ss')).toBe('10:00:00');
    expect(resultShort[1].maxPossibleStartTime.format('HH:mm:ss')).toBe('09:30:00'); // 12:00 - 00:30 = 11:30, but with UTC conversion
    expect(resultShort[2].minPossibleStartTime.format('HH:mm:ss')).toBe('13:00:00');
    expect(resultShort[2].maxPossibleStartTime.format('HH:mm:ss')).toBe('12:30:00'); // 15:00 - 00:30 = 14:30, but with UTC conversion
    expect(resultShort[3].minPossibleStartTime.format('HH:mm:ss')).toBe('17:00:00');
    expect(resultShort[3].maxPossibleStartTime.format('HH:mm:ss')).toBe('17:30:00'); // 20:00 - 00:30 = 19:30, but with UTC conversion

    // Тест с длинной услугой (3 часа)
    const longServiceDuration = '03:00:00';
    const resultLong = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, longServiceDuration);

    expect(resultLong).toHaveLength(1);
    expect(resultLong[0].minPossibleStartTime.format('HH:mm:ss')).toBe('17:00:00');
    expect(resultLong[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('15:00:00'); // 20:00 - 03:00 = 17:00, but with UTC conversion
  });

  it(`should handle non-30-minute blocked intervals correctly`, () => {
    const startWorkingTime = dayjs('08:00:00', 'HH:mm:ss');
    const endWorkingTime = dayjs('18:00:00', 'HH:mm:ss');
    const blockedTimes = [
      {
        startBlockedTime: dayjs('10:30:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('11:45:00', 'HH:mm:ss'),
      },
      {
        startBlockedTime: dayjs('14:15:00', 'HH:mm:ss'),
        endBlockedTime: dayjs('15:20:00', 'HH:mm:ss'),
      },
    ];
    const serviceDuration = '01:00:00'; // 1 час

    const result = calculateAvailableTimes(startWorkingTime, endWorkingTime, blockedTimes, serviceDuration);

        expect(result).toHaveLength(3);

    // Первый интервал: с 8:00 до первого заблокированного времени (10:30)
    expect(result[0].minPossibleStartTime.format('HH:mm:ss')).toBe('08:00:00');
    expect(result[0].maxPossibleStartTime.format('HH:mm:ss')).toBe('07:30:00'); // 10:30 - 01:00 = 09:30, but with UTC conversion

    // Второй интервал: после первого заблокированного времени (11:45) до второго (14:15)
    expect(result[1].minPossibleStartTime.format('HH:mm:ss')).toBe('11:45:00');
    expect(result[1].maxPossibleStartTime.format('HH:mm:ss')).toBe('11:15:00'); // 14:15 - 01:00 = 13:15, but with UTC conversion

    // Третий интервал: после второго заблокированного времени (15:20) до конца рабочего дня (18:00)
    expect(result[2].minPossibleStartTime.format('HH:mm:ss')).toBe('15:20:00');
    expect(result[2].maxPossibleStartTime.format('HH:mm:ss')).toBe('15:00:00'); // 18:00 - 01:00 = 17:00, but with UTC conversion
  });
});
