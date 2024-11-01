const express = require('express');
const router = express.Router();

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

// TODO: add route for creating appointments from crm
router.post(`/create`, async (req, res) => {
  const appointment = req.body;
});


module.exports = router;
