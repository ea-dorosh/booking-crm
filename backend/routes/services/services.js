const express = require('express');
const router = express.Router();
const { validateServiceForm } = require('./servicesUtils');

module.exports = (db) => {
  router.get(`/`, (req, res) => {
    const sql = `
      SELECT s.id, s.name, s.duration_time, s.buffer_time, sep.employee_id, sep.price
      FROM Services s
      LEFT JOIN ServiceEmployeePrice sep ON s.id = sep.service_id
    `;
  
    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).json({ error: `Error fetching services` });
      } else {
        const servicesMap = new Map(); // Using Map to group results by service ID
  
        // Group results by service ID
        results.forEach(row => {
          const { id, name, duration_time, buffer_time, employee_id, price } = row;
          if (!servicesMap.has(id)) {
            servicesMap.set(id, {
              id,
              name,
              durationTime: duration_time,
              bufferTime: buffer_time,
              employeePrices: [],
            });
          }
          // Push employee ID and price into the array
          if (employee_id) {
            servicesMap.get(id).employeePrices.push({ employeeId: employee_id, price });
          }
        });
  
        // Convert Map values to an array of services
        const data = Array.from(servicesMap.values());
  
        res.json(data);
      }
    });
  });
  
  router.post(`/create-service`, async (req, res) => {
    const service = req.body.service;

    // Validation
    const errors = validateServiceForm(service);

    if (Object.keys(errors).length > 0) {
        return res.status(428).json({ errors });
    }

    const serviceQuery = `
      INSERT INTO Services (employee_id, name, duration_time, buffer_time)
      VALUES (?, ?, ?, ?)
    `;

    const employeeIds = service.employeePrices.map(employeePrice => {
      if (employeePrice.price) {
        return employeePrice.employeeId
      }
    }).join(`,`);

    const serviceValues = [
        employeeIds,
        service.name,
        service.durationTime,
        service.bufferTime,
    ];

    let serviceId;

    try {
      const [serviceResults] = await db.promise().query(serviceQuery, serviceValues);
      serviceId = serviceResults.insertId;

      // set price to ServiceEmployeePrice table
      if (service.employeePrices.length) {
        for (const employeePrice of service.employeePrices) {
          console.log(employeePrice);
          await saveEmployeePriceForService({ db, res }, employeePrice, serviceId);
        }
      }

      res.json({
          message: `Service data inserted successfully`,
          data: serviceId,
      });
    } catch (error) {
      console.log(error);
      if (error.code === `ER_DUP_ENTRY`) {
        return res.status(428).json({ errors: { name: `Service with this name already exists` } });
      }
      return res.status(500).json(error);
    }
  });

  router.put(`/edit/:id`, async (req, res) => {
    const serviceId = req.params.id;
    const service = req.body.service;

    // Validation
    const errors = validateServiceForm(service);

    if (Object.keys(errors).length > 0) {
      return res.status(428).json({ errors });
    }

    const updateServiceQuery = `
      UPDATE Services
      SET employee_id = ?, name = ?, duration_time = ?, buffer_time = ?
      WHERE id = ?;
    `;

    const employeeIds = service.employeePrices.map(employeePrice => employeePrice.employeeId).join(`,`);

    const serviceValues = [
      employeeIds,
      service.name,
      service.durationTime,
      service.bufferTime,
      serviceId,
    ];

    try {
      await db.promise().query(updateServiceQuery, serviceValues);

      // Delete existing prices for the service
      await deleteEmployeesPriceForService({ db, res }, serviceId);

      // set price to ServiceEmployeePrice table
      if (service.employeePrices.length) {
        for (const employeePrice of service.employeePrices) {
          console.log(employeePrice);
          await saveEmployeePriceForService({ db, res }, employeePrice, serviceId);
        }
      }

      res.json({
          message: `Service data updated successfully`,
          data: serviceId,
      });
    } catch (error) {
      console.log(error);
      if (error.code === `ER_DUP_ENTRY`) {
        return res.status(428).json({ errors: { name: `Service with this name already exists` } });
      }
      return res.status(500).json(error);
    }
  });

  router.delete(`/:id`, (req, res) => {
    const serviceId = req.params.id;
    const deleteQuery = `DELETE FROM Services WHERE id = ?`;

    db.query(deleteQuery, [serviceId], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json(err);
        return;
      }
      
      if (results.affectedRows === 0) {
        res.status(404).json({ error: `Service not found` });
      } else {
        res.status(200).json({ message: `Service deleted successfully` });
      }
    });
  });

  return router;
};

const deleteEmployeesPriceForService = async ({ db, res }, serviceId) => {
  try {
    // Check if there's an existing record for the employee and service
    const deleteQuery = `DELETE FROM ServiceEmployeePrice WHERE service_id = ?`;

    await db.promise().query(deleteQuery, [serviceId]);
  } catch (error) {
    // Don't send response from here
    console.error(error);
    // Throw error so it can be caught by the main route handler
    throw error;
  }
};

const saveEmployeePriceForService = async ({ db, res }, employeePrice, serviceId) => {
  try {
    // Check if there's an existing record for the employee and service
    const checkQuery = `SELECT price FROM ServiceEmployeePrice WHERE employee_id = ? AND service_id = ?`;

    const [existingRows] = await db.promise().query(checkQuery, [employeePrice.employeeId, serviceId]);

    if (existingRows.length === 0 || existingRows[0].price !== employeePrice.price) {
      // If no existing record or price is different, insert a new one or update the price
      const query = existingRows.length === 0 ?
          `INSERT INTO ServiceEmployeePrice (employee_id, service_id, price) VALUES (?, ?, ?)` :
          `UPDATE ServiceEmployeePrice SET price = ? WHERE employee_id = ? AND service_id = ?`;

      const queryParams = existingRows.length === 0 ?
          [employeePrice.employeeId, serviceId, employeePrice.price] :
          [employeePrice.price, employeePrice.employeeId, serviceId];

      await db.execute(query, queryParams);
      console.log(existingRows.length === 0 ? `New record inserted successfully` : `Existing record updated successfully`);
    } else {
      console.log(`Price in database is already the same as the new service data. No need to update.`);
    }
  } catch (error) {
    // Don't send response from here
    console.error(error);
    // Throw error so it can be caught by the main route handler
    throw error;
  }
};