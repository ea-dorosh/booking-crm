const express = require('express');
const router = express.Router();
const { formattedName, formattedPhone } = require('../../utils/formatters');
const { validateEmployeeForm } = require('./employeesUtils');
const { upload } = require('../../utils/uploadFile');
const { getEmployees } = require('../../services/employees/employeesService');
const { getCustomers } = require('../../services/customer/customerService');

router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: `Database connection not initialized` });
  }

  try {
    const employees = await getEmployees(req.dbPool);

    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching employees` });
  }
});

router.post(`/create-employee`, upload.single(`image`), async (req, res) => {
  const employee = req.body;
  const imgPath = req.file?.filename || null;

  // Validation
  const errors = validateEmployeeForm(employee);

  if (Object.keys(errors).length > 0) {
    return res.status(428).json({ errors });
  }

  const query = `
    INSERT INTO Employees (first_name, last_name, email, phone, image)
    VALUES (?, ?, ?, ?, COALESCE(?, image))
  `;

  const values = [
    formattedName(employee.firstName),
    formattedName(employee.lastName),
    employee.email,
    formattedPhone(employee.phone),
    imgPath,
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
    return res.status(500).json(error);
  }
});

router.put(`/edit/:id`, upload.single(`image`), async (req, res) => {
  const employeeId = req.params.id;
  const employee = req.body;

  const imgPath = req.file?.filename || null;

  // Validation
  const errors = validateEmployeeForm(employee);

  if (Object.keys(errors).length > 0) {
    return res.status(428).json({ errors });
  }

  const query = `UPDATE Employees 
    SET first_name = ?, last_name = ?, email = ?, phone = ?, image = COALESCE(?, image)
    WHERE employee_id = ?
  `;

  const values = [
    formattedName(employee.firstName),
    formattedName(employee.lastName),
    employee.email,
    formattedPhone(employee.phone),
    imgPath,
    employeeId
  ];

  try {
    const [employeeResults] = await req.dbPool.query(query, values);

    res.json({
      message: `Employee data updated successfully`,
      data: employeeResults.insertId,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});

router.get(`/:employeeId/availabilities`, async (req, res) => {
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

router.post(`/availability`, async (req, res) => {
  const availability = req.body;

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

router.delete(`/:id/availability`, async (req, res) => {
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
    res.status(500).json({ error: `Error deleting EmployeeAvailability` });
    return;
  }
});

router.get(`/:id/appointments`, async (request, response) => {
  const employeeId = request.params.id;
  const customers = await getCustomers(request.dbPool);

  const sql = `
    SELECT 
      id, 
      date, 
      time_start, 
      time_end, 
      service_id, 
      service_name,
      created_date, 
      service_duration,
      customer_id,
      status
    FROM SavedAppointments
    WHERE employee_id = ?
  `;

  try {
    const [results] = await request.dbPool.query(sql, [employeeId]);

    const savedAppointments = results.map((row) => ({
      id: row.id,
      date: row.date,
      timeStart: row.time_start,
      timeEnd: row.time_end,
      createdDate: row.created_date,
      service: {
        id: row.service_id,
        name: row.service_name,
        duration: row.service_duration,
      },
      customer: {
        id: row.customer_id,
        firstName: customers.find(customer => customer.id === row.customer_id).firstName,
        lastName: customers.find(customer => customer.id === row.customer_id).lastName,
      },
      status: row.status,
    }));

    response.json(savedAppointments);
  } catch (error) {
    response.status(500).json({ 
      errorMessage: `Error fetching Saved Appointments`,
      message: error.message,
    });
  }
});

module.exports = router;
