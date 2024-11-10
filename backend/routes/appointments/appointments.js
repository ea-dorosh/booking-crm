const express = require('express');
const router = express.Router();
const {
  customerNewStatusEnum,
  appointmentStatusEnum,
} = require('../../enums/enums');


router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: `Database connection not initialized` });
  }

  const { startDate, status = null } = req.query;

  if (!startDate) {
    return res.status(400).json({ error: `startDate query parameter is required` });
  }

  const appointmentsSql = `
    SELECT 
      id, 
      date, 
      created_date, 
      service_name, 
      time_start, 
      service_duration,
      customer_last_name, 
      customer_first_name,
      status
      FROM SavedAppointments
    WHERE 
      date >= ?
      AND (status = COALESCE(?, status))
  `;

  const queryParams = [startDate, status];

  let appointmentsData = [];

  try {
    const [appointmentsResults] = await req.dbPool.query(appointmentsSql, queryParams);

    appointmentsData = appointmentsResults.map((row) => ({
      id: row.id,
      date: row.date, 
      createdDate: row.created_date, 
      serviceName: row.service_name, 
      timeStart: row.time_start, 
      serviceDuration: row.service_duration,
      customerLastName: row.customer_last_name, 
      customerFirstName: row.customer_first_name,
      status: row.status,
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching employees` });
  }
  
  res.json(appointmentsData);
});

router.get(`/:id`, async (req, res) => {
  const appointmentId = req.params.id;

  const sql = `
    SELECT 
      id, 
      employee_id, 
      date, 
      time_start, 
      time_end, 
      service_duration,
      service_id, 
      service_name, 
      customer_id, 
      created_date, 
      customer_last_name, 
      customer_first_name,
      is_customer_new,
      status
    FROM SavedAppointments
    WHERE id = ?
  `;

  try {
    const [results] = await req.dbPool.query(sql, [appointmentId]);

    const appointment = results.map((row) => ({
      id: row.id,
      date: row.date, 
      employeeId: row.employee_id,
      timeStart: row.time_start, 
      timeEnd: row.time_end, 
      serviceDuration: row.service_duration,
      serviceId: row.service_id, 
      serviceName: row.service_name, 
      createdDate: row.created_date, 
      customer: {
        id: row.customer_id,
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        isCustomerNew: row.is_customer_new === customerNewStatusEnum.existing ? false : true,
      },
      status: row.status,
    }));

    const employeeSql = `
      SELECT employee_id, first_name, last_name 
      FROM Employees 
      WHERE employee_id = ?
    `;

    const [employeeResults] = await req.dbPool.query(employeeSql, [appointment[0].employeeId]);

    appointment[0].employee = {
      id: employeeResults[0].employee_id,
      firstName: employeeResults[0].first_name,
      lastName: employeeResults[0].last_name
    };

    delete appointment[0].employeeId;

    res.json(appointment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching appointment` });
  }
});

router.put(`/:id/cancel`, async (req, res) => {
  const appointmentId = req.params.id;

  const sql = `
    UPDATE SavedAppointments
    SET status = ?
    WHERE id = ?
  `;

  try {
    await req.dbPool.query(sql, [appointmentStatusEnum.canceled, appointmentId]);

    res.json({ message: `Appointment status updated successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error updating appointment status` });
  }
});


// TODO: add route for creating appointments from crm
router.post(`/create`, async (req, res) => {
  const appointment = req.body;
});


module.exports = router;
