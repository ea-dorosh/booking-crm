const express = require('express');
const router = express.Router();
const { getServiceDuration } = require('../../utils/timeUtils');
const { formattedName, formattedPhone } = require('../../utils/formatters');
const { validateCustomerForm } = require('./appointmentsUtils');
const { getAppointmentEndTime } = require('../calendar/calendarUtils');
const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const { customerNewStatusEnum } = require('../../enums/enums');

dayjs.extend(advancedFormat);

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

  const checkAvailabilityValues = [
    employeeId, 
    date, 
    timeStart, 
    timeEnd, 
    timeStart,
    timeEnd, 
    timeStart, 
    timeEnd,
  ];

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

  let serviceDurationAndBufferTimeInMinutes;
  let serviceName;

  try {
    const serviceQuery = `SELECT * FROM Services WHERE id = ?`;
    const [serviceRows] = await req.dbPool.query(serviceQuery, [appointmentAndCustomer.serviceId]);

    /** save serviceName for response */
    serviceName = serviceRows[0].name;

    serviceDurationAndBufferTimeInMinutes = getServiceDuration(serviceRows[0].duration_time, serviceRows[0].buffer_time);
  } catch (error) {
    return res.status(500).json(error);
  }

  /** check customer already exists */
  const customerCheckQuery = `
    SELECT customer_id FROM Customers
    WHERE email = ?
  `;

  let isCustomerNew = customerNewStatusEnum.new;
  let customerId;

  try {
    const [customerResults] = await req.dbPool.query(customerCheckQuery, [appointmentAndCustomer.email]);

    if (customerResults.length >= 1) {
      isCustomerNew = customerNewStatusEnum.existing;
      customerId = customerResults[0].customer_id;
    }
  } catch (error) {
    return res.status(500).json(error);
  }

  if (isCustomerNew === customerNewStatusEnum.new) {
    const customerQuery = `
        INSERT INTO Customers (salutation, first_name, last_name, email, phone)
        VALUES (?, ?, ?, ?, ?)
      `;

    const customerValues = [
      appointmentAndCustomer.salutation,
      formattedName(appointmentAndCustomer.firstName),
      formattedName(appointmentAndCustomer.lastName),
      appointmentAndCustomer.email,
      formattedPhone(appointmentAndCustomer.phone),
    ];

    try {
      const [customerResults] = await req.dbPool.query(customerQuery, customerValues);
      customerId = customerResults.insertId;
    } catch (error) {
      return res.status(500).json(error);
    }
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

  if (res.headersSent) {
    return;
  }

  const appointmentQuery = `
    INSERT INTO SavedAppointments (
      date, 
      time_start, 
      time_end, 
      service_id, 
      service_name, 
      customer_id, 
      service_duration, 
      employee_id, 
      created_date,
      customer_salutation, 
      customer_first_name, 
      customer_last_name, 
      customer_email, 
      customer_phone, 
      is_customer_new
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const appointmentValues = [
    date,
    timeStart,
    timeEnd,
    appointmentAndCustomer.serviceId,
    serviceName,
    customerId,
    serviceDurationAndBufferTimeInMinutes,
    employeeId,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    appointmentAndCustomer.salutation,
    formattedName(appointmentAndCustomer.firstName),
    formattedName(appointmentAndCustomer.lastName),
    appointmentAndCustomer.email,
    formattedPhone(appointmentAndCustomer.phone),
    isCustomerNew,
  ];


  try {
    const [appointmentResults] = await req.dbPool.query(appointmentQuery, appointmentValues);

    res.json({ 
      message: `Appointment has been saved successfully`,
      data: {
        id: appointmentResults.insertId,
        date,
        timeStart,
        timeEnd,
        serviceName,
        firstName: formattedName(appointmentAndCustomer.firstName),
        lastName: formattedName(appointmentAndCustomer.lastName),
        salutation: appointmentAndCustomer.salutation,
      },
    });
  } catch (error) {
    console.error(`Error while creating appointments: ${error.message}`);
    return res.status(500).json(error);
  }
});

module.exports = router;