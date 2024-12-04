const express = require('express');
const router = express.Router();
const { getServiceDuration } = require('../../utils/timeUtils');
const { formattedName, formattedPhone } = require('../../utils/formatters');
const { 
  checkCustomerExists,
  createCustomer,
} = require('../../services/customer/customerService');
const { checkEmployeeTimeNotOverlap } = require('../../services/employees/employeesService');
const { getAppointmentEndTime } = require('../calendar/calendarUtils');
const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const { customerNewStatusEnum } = require('../../enums/enums');

dayjs.extend(advancedFormat);

router.post(`/create`, async (request, response) => {
  const appointmentAndCustomer = request.body.appointment;

  let serviceDurationAndBufferTimeInMinutes;
  let serviceName;

  try {
    const serviceQuery = `SELECT * FROM Services WHERE id = ?`;
    const [serviceRows] = await request.dbPool.query(serviceQuery, [appointmentAndCustomer.serviceId]);

    /** save serviceName for response */
    serviceName = serviceRows[0].name;

    serviceDurationAndBufferTimeInMinutes = getServiceDuration(serviceRows[0].duration_time, serviceRows[0].buffer_time);
  } catch (error) {
    response.status(500).json({
      errorMessage: `Error while fetching service`,
      error: error.message,
    });
  }

  /** check customer already exists and create if not */
  let isCustomerNew = customerNewStatusEnum.new;
  let customerId;

  try {
    const checkCustomerResult = await checkCustomerExists(request.dbPool, appointmentAndCustomer.email);

    if (checkCustomerResult.exists) {
      isCustomerNew = customerNewStatusEnum.existing;
      customerId = checkCustomerResult.customerId;
    } else {
      const { newCustomerId, validationErrors } = await createCustomer(request.dbPool, appointmentAndCustomer);

      if (validationErrors) {
        response.status(428).json({ 
            errorMessage: `Validation failed`,
            validationErrors,
          });
      } else if (newCustomerId) {
        customerId = newCustomerId;
      }
    }
  } catch (error) {
    response.status(500).json({ 
      errorMessage: `Error while creating customer`,
      message: error.message,
    });
  }

  const employeeId = appointmentAndCustomer.employeeId;
  const date = appointmentAndCustomer.date;
  const timeStart = appointmentAndCustomer.time;
  const timeEnd = getAppointmentEndTime(timeStart, serviceDurationAndBufferTimeInMinutes);

  try {
    const { isEmployeeAvailable } = await checkEmployeeTimeNotOverlap(request.dbPool, { date, employeeId, timeStart, timeEnd })

    if (!isEmployeeAvailable) {
      response.status(409).json({ 
        errorMessage: `Employee is already busy at the specified date and time.`,
      });
    }
  } catch (error) {
    response.status(500).json({ 
      errorMessage: `Error while checking employee availability`,
      message: error.message,
    });
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
    dayjs().format(`YYYY-MM-DD HH:mm:ss`),
    appointmentAndCustomer.salutation,
    formattedName(appointmentAndCustomer.firstName),
    formattedName(appointmentAndCustomer.lastName),
    appointmentAndCustomer.email,
    formattedPhone(appointmentAndCustomer.phone),
    isCustomerNew,
  ];


  try {
    const [appointmentResults] = await request.dbPool.query(appointmentQuery, appointmentValues);

    response.json({ 
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
    response.status(500).json({ 
      errorMessage: `Error while creating appointment`,
      message: error.message,
    });
  }
});

module.exports = router;