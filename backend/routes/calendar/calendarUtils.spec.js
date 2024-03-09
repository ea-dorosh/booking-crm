const { 
  getAppointmentEndTime, 
  disableTimeSlotsForServiceDuration, 
  addTimeSlotsAccordingEmployeeAvailability,
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
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false },
    ];

    const filteredSlots1 = disableTimeSlotsForServiceDuration(availableTimeSlots1, `01:30:00`);

    expect(filteredSlots1).toEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: true, notActive: true },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: true, notActive: true },
    ]);

    const availableTimeSlots2 = [
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: false },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false },
    ];

    const filteredSlots2 = disableTimeSlotsForServiceDuration(availableTimeSlots2, `00:40:00`);

    expect(filteredSlots2).toEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: false },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: true, notActive: true },
    ]);
  });

  it(`should filter out time slots that are before appointment end time and that are before disabled time slots (blocked)`, () => {
    const availableTimeSlots1 = [
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: true },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: false },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: true },
      { startTime: `13:00:00`, endTime: `13:30:00`, disabled: false },
    ];

    const filteredSlots1 = disableTimeSlotsForServiceDuration(availableTimeSlots1, `01:00:00`);

    expect(filteredSlots1).toEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: true, notActive: true },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: true },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: true, notActive: true },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: true, notActive: true },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: true },
      { startTime: `13:00:00`, endTime: `13:30:00`, disabled: true, notActive: true },
    ]);

    const availableTimeSlots2 = [
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: false },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: true },
      { startTime: `13:00:00`, endTime: `13:30:00`, disabled: false },
    ];

    const filteredSlots2 = disableTimeSlotsForServiceDuration(availableTimeSlots2, `01:40:00`);

    expect(filteredSlots2).toEqual([
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: true, notActive: true },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: true, notActive: true },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: true, notActive: true },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: true, notActive: true },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: true, notActive: true },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: true },
      { startTime: `13:00:00`, endTime: `13:30:00`, disabled: true, notActive: true },
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
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: 1 },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: 1 },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: false, employeeId: 1 },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: 1 },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: false, employeeId: 1},
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false, employeeId: 1 },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: false, employeeId: 1 },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: false, employeeId: 1 },
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
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: 1 },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: 1 },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: true, employeeId: 1 },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: 1 },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: false, employeeId: 1 },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: false, employeeId: 1 },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: false, employeeId: 1 },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: false, employeeId: 1 },
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
      { startTime: `09:00:00`, endTime: `09:30:00`, disabled: false, employeeId: 1 },
      { startTime: `09:30:00`, endTime: `10:00:00`, disabled: false, employeeId: 1 },
      { startTime: `10:00:00`, endTime: `10:30:00`, disabled: true, employeeId: 1 },
      { startTime: `10:30:00`, endTime: `11:00:00`, disabled: false, employeeId: 1 },
      { startTime: `11:00:00`, endTime: `11:30:00`, disabled: true, employeeId: 1 },
      { startTime: `11:30:00`, endTime: `12:00:00`, disabled: true, employeeId: 1 },
      { startTime: `12:00:00`, endTime: `12:30:00`, disabled: true, employeeId: 1 },
      { startTime: `12:30:00`, endTime: `13:00:00`, disabled: false, employeeId: 1 },
    ]);
  });
});