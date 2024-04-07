const express = require('express');
const router = express.Router();
const { formattedName, formattedPhone } = require('../../utils/formatters');
const { validateEmployeeForm } = require('./employeesUtils');

router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: "Database connection not initialized" });
  }

  const sql = `SELECT employee_id, first_name, last_name, email, phone FROM Employees`;

  try {
    const [results] = await req.dbPool.query(sql);

    const data = results.map((row) => ({
      employeeId: row.employee_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
    }));

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching employees` });
  }
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

  let employeeId;

  try {
    const [employeeResults] = await req.dbPool.query(query, values);
    employeeId = employeeResults.insertId;

    res.json({
        message: `New employee data inserted successfully`,
        data: employeeId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
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

  try {
    const [employeeResults] = await req.dbPool.query(query, values);

    res.json({
      message: `Employee data updated successfully`,
      data: employeeResults.insertId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

router.get(`/employee-availability/:employeeId`, async (req, res) => {
  const employeeId = req.params.employeeId;

  const sql = `SELECT * FROM EmployeeAvailability WHERE employee_id = ?`;

  try {
    const [results] = await req.dbPool.query(sql, [employeeId]);

    const data = results.map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      dayId: row.day_id,
      startTime: row.start_time,
      endTime: row.end_time,
    }));

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching EmployeeAvailability` });
    return;
  }
});

router.post(`/employee-availability`, async (req, res) => {
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

  try {
    const [result] = await req.dbPool.query(upsertQuery, [values]);

    res.json({ 
      message: `Availability data inserted successfully`,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error updating EmployeeAvailability` });
    return;
  }
});

router.delete(`/employee-availability/:id`, async (req, res) => {
  const availabilityId = req.params.id;

  const deleteQuery = `DELETE FROM EmployeeAvailability WHERE id = ?`;

  try {
    const [results] = await req.dbPool.query(deleteQuery, [availabilityId]);

    if (results.affectedRows === 0) {
      res.status(404).json({ error: `Availability not found` });
    } else {
      res.status(200).json({ message: `Availability deleted successfully` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error deleteing EmployeeAvailability` });
    return;
  }
});

module.exports = router;
