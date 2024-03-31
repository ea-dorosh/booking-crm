const express = require('express');
const router = express.Router();
const { formattedName, formattedPhone } = require('../../utils/formatters');
const { validateEmployeeForm } = require('./employeesUtils');

module.exports = (db) => {
  router.get(`/`, (req, res) => {
    // Use the db object to query for services

    const sql = `SELECT employee_id, first_name, last_name, email, phone FROM Employees`;

    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: `Error fetching employees` });
      } else {
        const data = results.map((row) => ({
          employeeId: row.employee_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
        }));
        res.json(data);
      }
    });
  });

  router.post(`/create-employee`, async (req, res) => {
    const employee = req.body.employee;

    // Validation
    const errors = validateEmployeeForm(employee);

    if (Object.keys(errors).length > 0) {
      return res.status(428).json({ errors });
    }

    const query = `
      INSERT INTO Employees (first_name, last_name, email, phone)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      formattedName(employee.firstName),
      formattedName(employee.lastName),
      employee.email,
      formattedPhone(employee.phone),
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        // if (err.code === `ER_DUP_ENTRY`) {
        //   return res.status(428).json({ errors: { name: `Service with this name already exists` } });
        // }
        // return res.status(500).json(err);
      } else {
        console.log(`createEmployee`, result);
        res.json({
          message: `New employee data inserted successfully`,
          data: result.insertId,
        });
      }
    });
  });

  router.put(`/edit/:id`, async (req, res) => {
    const employeeId = req.params.id;
    const employee = req.body.employee;

    // Validation
    const errors = validateEmployeeForm(employee);

    if (Object.keys(errors).length > 0) {
      return res.status(428).json({ errors });
    }

    const query = `UPDATE Employees SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE employee_id = ?
    `;

    const values = [
      formattedName(employee.firstName),
      formattedName(employee.lastName),
      employee.email,
      formattedPhone(employee.phone),
      employeeId
    ];

    db.query(query, values, (err, results) => {
      if (err) {
        return res.status(500).json(err);
      } else {
        res.json({ message: `Employee data updated successfully` });
      }
    });
  });

  router.get(`/employee-availability/:employeeId`, (req, res) => {
    const employeeId = req.params.employeeId;

    const sql = `SELECT * FROM EmployeeAvailability WHERE employee_id = ?`;

    db.query(sql, [employeeId], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: `Error fetching EmployeeAvailability` });
        return;
      } else {
        const data = results.map((row) => ({
          id: row.id,
          employeeId: row.employee_id,
          dayId: row.day_id,
          startTime: row.start_time,
          endTime: row.end_time,
        }));
        res.json(data);
      }
    });
  });

  router.post(`/employee-availability`, (req, res) => {
    const availability = req.body.availability;

    const upsertQuery = `
    INSERT INTO EmployeeAvailability (employee_id, day_id, start_time, end_time) 
    VALUES ?
    ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)
  `;
  
    const values = [availability].map(({ employeeId, dayId, startTime, endTime }) => [
      employeeId,
      dayId,
      startTime,
      endTime,
    ]);
  
    db.query(upsertQuery, [values], (error, result) => {
      if (error) {
        console.error(error);
      }

      res.json({ 
        message: `Availability data inserted successfully`,
        data: result,
      });
    });
  });

  router.delete(`/employee-availability/:id`, (req, res) => {
    const availabilityId = req.params.id;
  
    const deleteQuery = `DELETE FROM EmployeeAvailability WHERE id = ?`;
  
    db.query(deleteQuery, [availabilityId], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: `Internal Server Error` });
        return;
      }
  
      if (results.affectedRows === 0) {
        res.status(404).json({ error: `Availability not found` });
      } else {
        res.status(200).json({ message: `Availability deleted successfully` });
      }
    });
  });

  return router;
};
