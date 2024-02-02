const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/employees', (req, res) => {
    // Use the db object to query for services

    const sql = 'SELECT employee_id, employee_name FROM Employees';

    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching employees' });
      } else {
        const data = results.map((row) => ({
          employeeId: row.employee_id,
          employeeName: row.employee_name,
        }));
        res.json(data);
      }
    });
  });

  router.get('/days', (req, res) => {
    const sql = 'SELECT day_id, day_name FROM DaysOfWeek';

    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error fetching DaysOfWeek' });
      } else {
        const data = results.map((row) => ({
          dayId: row.day_id,
          dayName: row.day_name,
        }));
        res.json(data);
      }
    });
  });

  router.get('/time-slots', (req, res) => {
    const sql = 'SELECT timeslot_id, start_time, end_time FROM TimeSlots';

    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error fetching TimeSlots' });
      } else {
        const data = results.map((row) => ({
          id: row.timeslot_id,
          startTime: row.start_time,
          endTime: row.end_time,
        }));
        res.json(data);
      }
    });
  });

  router.get('/employee-availability/:employeeId', (req, res) => {
    const employeeId = req.params.employeeId;

    const sql = 'SELECT * FROM EmployeeAvailability WHERE employee_id = ?';

    // const sql = 'SELECT id, employee_id, day_id, start_time_id, end_time_id FROM EmployeeAvailability';

    db.query(sql, [employeeId], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching EmployeeAvailability' });
        return;
      } else {
        const data = results.map((row) => ({
          id: row.id,
          employeeId: row.employee_id,
          dayId: row.day_id,
          startTimeId: row.start_time_id,
          endTimeId: row.end_time_id,
        }));
        res.json(data);
      }
    });
  });

  router.post('/employee-availability', (req, res) => {
    const availability = req.body.availability;
    upsertAvailability([availability], db);

    res.json({ message: 'Availability data inserted successfully' });
  });

  router.delete('/employee-availability/:id', (req, res) => {
    const availabilityId = req.params.id;
  
    const deleteQuery = 'DELETE FROM EmployeeAvailability WHERE id = ?';
  
    db.query(deleteQuery, [availabilityId], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Availability not found' });
      } else {
        res.status(200).json({ message: 'Availability deleted successfully' });
      }
    });
  });

  return router;
};




function upsertAvailability(availabilities, connection) {
  const upsertQuery = `
  INSERT INTO EmployeeAvailability (employee_id, day_id, start_time_id, end_time_id) 
  VALUES ?
  ON DUPLICATE KEY UPDATE start_time_id = VALUES(start_time_id), end_time_id = VALUES(end_time_id)
`;

  const values = availabilities.map(({ employeeId, dayId, startTimeId, endTimeId }) => [
    employeeId,
    dayId,
    startTimeId,
    endTimeId,
  ]);

  connection.query(upsertQuery, [values], (err, results) => {
    if (err) {
      console.error(err);
    }
  });
}
