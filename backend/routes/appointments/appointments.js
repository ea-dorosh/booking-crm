const express = require('express');
const router = express.Router();
const { getServiceDuration } = require('../../utils/timeUtils');
const { validateEmail, validatePhone } = require('../../utils/validators');
const { formattedName, formattedPhone } = require('../../utils/formatters');



module.exports = (db) => {
  router.post(`/create`, async (req, res) => {
    const appointmentAndCustomer = req.body.appointment;

    // Validation
    const errors = {};

    if (!validateEmail(appointmentAndCustomer.email)) {
      errors.email = `Invalid email address`;
    }

    if ((!appointmentAndCustomer.firstName.length)) {
      errors.firstName = `Invalid first name`;
    }

    if ((!appointmentAndCustomer.lastName.length)) {
      errors.lastName = `Invalid last name`;
    }

    if (!validatePhone(appointmentAndCustomer.phone)) {
      errors.phone = `Invalid phone number`;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(428).json({ errors });
    }

    let serviceDurationAndBufferTimeInMinutes;
    try {
      // get Service from the database
      const serviceQuery = `SELECT * FROM Services WHERE id = ?`;
      const [serviceRows] = await db.promise().query(serviceQuery, [appointmentAndCustomer.serviceId]);

      //get service duration (service_time + buffer_time)
      serviceDurationAndBufferTimeInMinutes = getServiceDuration(serviceRows[0].duration_time, serviceRows[0].buffer_time);
    } catch (error) {
      return res.status(500).json(error);
    }

    const customerQuery = `
        INSERT INTO Customers (first_name, last_name, email, phone)
        VALUES (?, ?, ?, ?)
      `;

    const customerValues = [
      formattedName(appointmentAndCustomer.firstName),
      formattedName(appointmentAndCustomer.lastName),
      appointmentAndCustomer.email,
      formattedPhone(appointmentAndCustomer.phone),
    ];

    let customerId;

    try {
      const [customerResults] = await db.promise().query(customerQuery, customerValues);
      customerId = customerResults.insertId;
    } catch (error) {
      return res.status(500).json(error);
    }

    const appointmentQuery = `
      INSERT INTO SavedAppointments (date, time, service_id, customer_id, service_duration, employee_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const appointmentValues = [
      appointmentAndCustomer.date,
      appointmentAndCustomer.time,
      appointmentAndCustomer.serviceId,
      customerId,
      serviceDurationAndBufferTimeInMinutes,
      1, // employee_id
    ];

    db.query(appointmentQuery, appointmentValues, (err, result) => {
      if (err) {
          console.error(`Error while creating appointments: ${err.message}`);
          return;
      }

      res.json({ 
        message: `Appointment has been saved successfully`,
        data: result,
      });
    });
  });

  return router;
};
