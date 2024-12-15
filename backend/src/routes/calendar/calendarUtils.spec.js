const { 
  getAppointmentEndTime, 
  disableTimeSlotsForServiceDuration, 
  addTimeSlotsAccordingEmployeeAvailability,
  replaceExistingDayWithNewEmployeeData,
} = require('./calendarUtils');

describe(`getAppointmentEndTime`, () => {
  it(`should correctly calculate the end time of an appointment`, () => {
    const endTime1 = getAppointmentEndTime(`09:00:00`, `01:30:00`);
    expect(endTime1).toBe(`10:30:00`);

    const endTime2 = getAppointmentEndTime(`23:00:00`, `02:15:00`);
    expect(endTime2).toBe(`01:15:00`);

    const endTime3 = getAppointmentEndTime(`09:00:00`, `02:45:00`);
    expect(endTime3).toBe(`11:45:00`);
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
    const blockedTimes = [];

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
        startBlockedTime: `10:00:00`,
        endBlockedTime: `10:30:00`,
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
        startBlockedTime: `10:00:00`,
        endBlockedTime: `10:30:00`,
      },
      {
        startBlockedTime: `11:00:00`,
        endBlockedTime: `12:10:00`,
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
          employeeId: [1]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1]
        },
      ]
    }

    const newEmployeeData = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2]
        },
      ]
    };

    const replacedDay = replaceExistingDayWithNewEmployeeData({
      existingDay,
      newDay: newEmployeeData,
    });

    expect(replacedDay).toStrictEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1, 2]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1, 2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1, 2]
        },
      ]
    });
  })

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
          employeeId: []
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: true,
          employeeId: []
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: true,
          employeeId: []
        },
      ]
    }

    const newEmployeeData = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2]
        },
      ]
    };

    const replacedDay = replaceExistingDayWithNewEmployeeData({
      existingDay,
      newDay: newEmployeeData,
    });

    expect(replacedDay).toStrictEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2]
        },
      ]
    });
  })

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
          employeeId: [1]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1]
        },
      ]
    }

    const newEmployeeData = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: true,
          employeeId: []
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: []
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: []
        },
      ]
    };

    const replacedDay = replaceExistingDayWithNewEmployeeData({
      existingDay,
      newDay: newEmployeeData,
    });

    expect(replacedDay).toStrictEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1]
        },
      ]
    });
  })

  it(`should replace the existing day with new employee data when existing day has some disabled timeslots and newDate has some other disabled timeslots`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: true,
          employeeId: []
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1]
        },
      ]
    }

    const newEmployeeData = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: true,
          employeeId: []
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2]
        },
      ]
    };

    const replacedDay = replaceExistingDayWithNewEmployeeData({
      existingDay,
      newDay: newEmployeeData,
    });

    expect(replacedDay).toStrictEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1, 2]
        },
      ]
    });
  })

  it(`should replace the existing day with new employee data when existing day has some disabled timeslots and newDate has same disabled timeslots`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: true,
          employeeId: []
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1]
        },
      ]
    }

    const newEmployeeData = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: true,
          employeeId: []
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2]
        },
      ]
    };

    const replacedDay = replaceExistingDayWithNewEmployeeData({
      existingDay,
      newDay: newEmployeeData,
    });

    expect(replacedDay).toStrictEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1, 2]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: true,
          employeeId: []
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1, 2]
        },
      ]
    });
  })

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
          employeeId: [1]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: true,
          employeeId: []
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1]
        },
      ]
    }

    const newEmployeeData = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2]
        },
      ]
    };

    const replacedDay = replaceExistingDayWithNewEmployeeData({
      existingDay,
      newDay: newEmployeeData,
    });

    expect(replacedDay).toStrictEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [1]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [1, 2]
        },
      ]
    });
  })

  it(`should replace the existing day with new employee data when existing day has less timeslots than newDate`, () => {
    const existingDay = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1]
        },
      ]
    }

    const newEmployeeData = {
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2]
        },
      ]
    };

    const replacedDay = replaceExistingDayWithNewEmployeeData({
      existingDay,
      newDay: newEmployeeData,
    });

    expect(replacedDay).toStrictEqual({
      day: `2024-03-11`,
      startTime: `10:00:00`,
      endTime: `20:00:00`,
      availableTimeslots: [
        {
          startTime: `10:00:00`,
          endTime: `10:30:00`,
          disabled: false,
          employeeId: [2]
        },
        {
          startTime: `10:30:00`,
          endTime: `11:00:00`,
          disabled: false,
          employeeId: [1, 2]
        },
          {
          startTime: `11:00:00`,
          endTime: `11:30:00`,
          disabled: false,
          employeeId: [2]
        },
      ]
    });
  })
});