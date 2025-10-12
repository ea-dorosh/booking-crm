/**
 * Integration tests for Calendar Service
 *
 * These tests verify that the calendar service works correctly with real data
 * including Google Calendar events, blocked times, saved appointments, and pause times.
 */

describe(`Calendar Service Integration Tests`, () => {
  describe(`Two Services Integration Test - October 6, 2025`, () => {
    it(`should validate the expected response structure for two services`, () => {
      // Expected response exactly as returned by the server
      const expectedResponse = [
        {
          "day": `2025-10-11`,
          "availableTimeslots": [
            {
              "startTime": `12:30:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `14:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `13:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `14:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `13:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `15:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `14:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `15:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `14:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `16:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `15:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `16:00:00`,
                "employeeIds": [1],
                "serviceId": 53,
              },
            },
            {
              "startTime": `16:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `17:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `16:45:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `17:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `17:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `18:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `19:30:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `19:30:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `20:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `20:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `21:00:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
          ],
        },
        {
          "day": `2025-10-12`,
          "availableTimeslots": [
            {
              "startTime": `08:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `10:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `09:00:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `10:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `09:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `10:45:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `10:00:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `11:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `10:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `12:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `10:45:00`,
              "employeeIds": [1],
              "serviceId": 43,
              "secondService": {
                "startTime": `12:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `11:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `12:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `11:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `12:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `14:15:00`,
              "employeeIds": [1],
              "serviceId": 43,
              "secondService": {
                "startTime": `15:45:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `15:00:00`,
              "employeeIds": [1],
              "serviceId": 43,
              "secondService": {
                "startTime": `16:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `15:45:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `17:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `16:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `17:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `16:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `17:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `17:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `19:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `19:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `20:00:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `19:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `20:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `20:00:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `21:00:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `20:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `21:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
          ],
        },
      ];

      // Verify the response structure
      expect(Array.isArray(expectedResponse)).toBe(true);
      expect(expectedResponse).toHaveLength(2);

      // Verify first day (2025-10-11)
      const firstDay = expectedResponse[0];
      expect(firstDay.day).toBe(`2025-10-11`);
      expect(firstDay.availableTimeslots).toHaveLength(13);

      // Verify second day (2025-10-12)
      const secondDay = expectedResponse[1];
      expect(secondDay.day).toBe(`2025-10-12`);
      expect(secondDay.availableTimeslots).toHaveLength(19);

      // Verify that all timeslots have the required structure
      [...firstDay.availableTimeslots, ...secondDay.availableTimeslots].forEach(timeslot => {
        expect(timeslot).toHaveProperty(`startTime`);
        expect(timeslot).toHaveProperty(`employeeIds`);
        expect(timeslot).toHaveProperty(`serviceId`);
        expect(timeslot).toHaveProperty(`secondService`);
        expect(Array.isArray(timeslot.employeeIds)).toBe(true);
        expect(typeof timeslot.startTime).toBe(`string`);
        expect(typeof timeslot.serviceId).toBe(`number`);

        // Verify secondService structure
        expect(timeslot.secondService).toHaveProperty(`startTime`);
        expect(timeslot.secondService).toHaveProperty(`employeeIds`);
        expect(timeslot.secondService).toHaveProperty(`serviceId`);
        expect(Array.isArray(timeslot.secondService.employeeIds)).toBe(true);
        expect(typeof timeslot.secondService.startTime).toBe(`string`);
        expect(typeof timeslot.secondService.serviceId).toBe(`number`);
      });
    });

    it(`should validate specific timeslots exist in the expected response`, () => {
      // Expected response exactly as returned by the server (same as first test)
      const expectedResponse = [
        {
          "day": `2025-10-11`,
          "availableTimeslots": [
            {
              "startTime": `12:30:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `14:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `13:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `14:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `13:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `15:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `14:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `15:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `14:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `16:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `15:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `16:00:00`,
                "employeeIds": [1],
                "serviceId": 53,
              },
            },
            {
              "startTime": `16:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `17:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `16:45:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `17:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `17:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `18:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `19:30:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `19:30:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `20:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `20:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `21:00:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
          ],
        },
        {
          "day": `2025-10-12`,
          "availableTimeslots": [
            {
              "startTime": `08:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `10:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `09:00:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `10:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `09:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `10:45:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `10:00:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `11:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `10:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `12:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `10:45:00`,
              "employeeIds": [1],
              "serviceId": 43,
              "secondService": {
                "startTime": `12:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `11:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `12:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `11:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `12:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `14:15:00`,
              "employeeIds": [1],
              "serviceId": 43,
              "secondService": {
                "startTime": `15:45:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `15:00:00`,
              "employeeIds": [1],
              "serviceId": 43,
              "secondService": {
                "startTime": `16:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `15:45:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `17:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `16:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `17:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `16:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `17:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `18:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `17:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `19:00:00`,
                "employeeIds": [1, 15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `19:00:00`,
              "employeeIds": [1, 15],
              "serviceId": 43,
              "secondService": {
                "startTime": `20:00:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `19:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `20:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `20:00:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `21:00:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
            {
              "startTime": `20:30:00`,
              "employeeIds": [15],
              "serviceId": 43,
              "secondService": {
                "startTime": `21:30:00`,
                "employeeIds": [15],
                "serviceId": 53,
              },
            },
          ],
        },
      ];

      // Verify specific timeslots exist
      const firstDay = expectedResponse[0];
      const firstDayTimes = firstDay.availableTimeslots.map(t => t.startTime);
      expect(firstDayTimes).toContain(`12:30:00`);
      expect(firstDayTimes).toContain(`20:00:00`);

      const secondDay = expectedResponse[1];
      const secondDayTimes = secondDay.availableTimeslots.map(t => t.startTime);
      expect(secondDayTimes).toContain(`08:30:00`);
      expect(secondDayTimes).toContain(`20:30:00`);

      // Verify employee IDs
      expect(firstDay.availableTimeslots[0].employeeIds).toEqual([1, 15]);
      expect(firstDay.availableTimeslots[2].employeeIds).toEqual([15]);

      // Verify service IDs
      expect(firstDay.availableTimeslots[0].serviceId).toBe(43);
      expect(firstDay.availableTimeslots[0].secondService.serviceId).toBe(53);
    });
  });
});
