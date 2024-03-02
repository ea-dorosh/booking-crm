const express = require("express");
const router = express.Router();
const { getServiceDuration } = require('../utils/timeUtils');

// const getServiceDuration = (durationTime, bufferTime) => {
//   if (!bufferTime) return durationTime;

//   const format = "HH:mm:ss";
//   const parsedTime1 = dayjs(durationTime, format);
//   const parsedTime2 = dayjs(bufferTime, format);

//   // Add the times together
//   const totalTime = parsedTime1.add(parsedTime2.hour(), 'hour').add(parsedTime2.minute(), 'minute').add(parsedTime2.second(), 'second');

//   return totalTime.format(format);
// }

module.exports = (db) => {
    router.post("/create", async (req, res) => {
    const appointmentAndCustomer = req.body.appointment;

    // get Service from the database
    const serviceQuery = 'SELECT * FROM Services WHERE id = ?';
    const [serviceRows] = await db.promise().query(serviceQuery, [appointmentAndCustomer.serviceId]);

    //get service duration (service_time + buffer_time)
    const serviceDurationAndBufferTimeInMinutes = getServiceDuration(serviceRows[0].duration_time, serviceRows[0].buffer_time);

    const customerQuery = `
        INSERT INTO Customers (first_name, last_name, email, phone)
        VALUES (?, ?, ?, ?)
      `;

    const customerValues = [
      appointmentAndCustomer.firstName,
      appointmentAndCustomer.lastName,
      appointmentAndCustomer.email,
      appointmentAndCustomer.phone,
        ];

    let customerId;


    db.query(customerQuery, customerValues, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Error when create a customer" });
      } else {
        customerId = results.insertId;

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
              console.error('Ошибка при добавлении записи SavedAppointments: ' + err.message);
              return;
          }

          res.json({ 
            message: `Appointment has been saved successfully`,
            data: result,
          });
        });
      }
    });
  });

  return router;
};
