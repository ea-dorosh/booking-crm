const express = require('express');
const router = express.Router();
const {customerNewStatusEnum} = require('../../enums/enums');


router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: `Database connection not initialized` });
  }

  const employeeSql = `SELECT employee_id, first_name, last_name, email, phone, image FROM Employees`;

  let employeesData = [];

  try {
    const [employeeResults] = await req.dbPool.query(employeeSql);

    employeesData = employeeResults.map((row) => ({
      employeeId: row.employee_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      image: row.image ? `${process.env.SERVER_API_URL}/images/${row.image}` : `${process.env.SERVER_API_URL}/images/no-user-photo.png`,
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching employees` });
  }

  const appointmentsSql = `
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
      customer_first_name 
    FROM SavedAppointments
  `;

  let appointmentsData = [];

  try {
    const [appointmentsResults] = await req.dbPool.query(appointmentsSql);

    appointmentsData = appointmentsResults.map((row) => ({
      id: row.id,
      date: row.date, 
      employeeId: row.employee_id,
      timeStart: row.time_start, 
      timeEnd: row.time_end, 
      serviceDuration: row.service_duration,
      serviceId: row.service_id, 
      serviceName: row.service_name, 
      customerId: row.customer_id, 
      createdDate: row.created_date, 
      customerLastName: row.customer_last_name, 
      customerFirstName: row.customer_first_name,
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching employees` });
  }

  const response = appointmentsData.map((appointment) => {
    const modifiedAppointment = { ...appointment };

    modifiedAppointment.employeeFirstName = employeesData.find((employee) => employee.employeeId === appointment.employeeId).firstName;
    modifiedAppointment.employeeLastName = employeesData.find((employee) => employee.employeeId === appointment.employeeId).lastName;

    return modifiedAppointment;
  });
  
    res.json(response);
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


// TODO: add route for creating appointments from crm
router.post(`/create`, async (req, res) => {
  const appointment = req.body;
});


module.exports = router;
