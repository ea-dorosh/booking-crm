import dayjs from 'dayjs';
import {
  getAppointmentEndTime,
  disableTimeSlotsForServiceDuration,
  addTimeSlotsAccordingEmployeeAvailability,
  replaceExistingDayWithNewEmployeeData,
  calculateAdjustedEndTime,
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
