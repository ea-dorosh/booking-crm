const express = require('express');
const router = express.Router();
const { getServiceDuration } = require('../../utils/timeUtils');
const { formattedName, formattedPhone } = require('../../utils/formatters');
const { validateCustomerForm } = require('./appointmentsUtils');
const { getAppointmentEndTime } = require('../calendar/calendarUtils');

const checkEmployeeTimeNotOverlap = async ({db, res}, {date, employeeId, timeStart, timeEnd }) => {
  const checkAvailabilityQuery = `
    SELECT * FROM SavedAppointments 
    WHERE employee_id = ? 
    AND date = ? 
    AND (
      (time_start >= ? AND time_start < ?) OR 
      (time_end > ? AND time_end <= ?) OR 
      (time_start <= ? AND time_end >= ?)
    )
  `;

  const checkAvailabilityValues = [employeeId, date, timeStart, timeEnd, timeStart, timeEnd, timeStart, timeEnd];

  try {
    const [existingAppointments] = await db.query(checkAvailabilityQuery, checkAvailabilityValues);

    if (existingAppointments.length > 0) {
      return res.status(409).json({ error: `Employee is already busy at the specified date and time.` });
    }
  } catch (error) {
    return res.status(500).json(error);
  }
};

router.post(`/create`, async (req, res) => {
  const appointmentAndCustomer = req.body.appointment;

  // Validation
  const errors = validateCustomerForm(appointmentAndCustomer);

  if (Object.keys(errors).length > 0) {
    return res.status(428).json({ errors });
  }
console.log(`appointmentAndCustomer`, appointmentAndCustomer);

  let serviceDurationAndBufferTimeInMinutes;
  try {
    // get Service from the database
    const serviceQuery = `SELECT * FROM Services WHERE id = ?`;
    const [serviceRows] = await req.dbPool.query(serviceQuery, [appointmentAndCustomer.serviceId]);

    //get service duration (service_time + buffer_time)
    serviceDurationAndBufferTimeInMinutes = getServiceDuration(serviceRows[0].duration_time, serviceRows[0].buffer_time);
  } catch (error) {
    console.log(`1 catch (error)`, error);
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
    const [customerResults] = await req.dbPool.query(customerQuery, customerValues);
    customerId = customerResults.insertId;
  } catch (error) {
    console.log(`2 catch (error)`, error);
    return res.status(500).json(error);
  }

  const employeeId = appointmentAndCustomer.employeeId;
  const date = appointmentAndCustomer.date;
  const timeStart = appointmentAndCustomer.time;
  const timeEnd = getAppointmentEndTime(timeStart, serviceDurationAndBufferTimeInMinutes);

  await checkEmployeeTimeNotOverlap({
    db: req.dbPool, 
    res,
    req,
  }, {date, employeeId, timeStart, timeEnd });

  const appointmentQuery = `
    INSERT INTO SavedAppointments (date, time_start, time_end, service_id, customer_id, service_duration, employee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const appointmentValues = [
    date,
    timeStart,
    timeEnd,
    appointmentAndCustomer.serviceId,
    customerId,
    serviceDurationAndBufferTimeInMinutes,
    employeeId,
  ];


  try {
    const [appointmentResults] = await req.dbPool.query(appointmentQuery, appointmentValues);

    res.json({ 
      message: `Appointment has been saved successfully`,
      data: appointmentResults,
    });
  } catch (error) {
    console.error(`Error while creating appointments: ${error.message}`);
    return res.status(500).json(error);
  }
});

module.exports = router;