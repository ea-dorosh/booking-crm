const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { validateServiceForm } = require('./servicesUtils');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {    
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
});

router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: `Database connection not initialized` });
  }

  const sql = `
    SELECT 
      s.id, 
      s.name, 
      s.category_id, 
      s.duration_time, 
      s.buffer_time,
      s.booking_note,
      sep.employee_id,
      sep.price
    FROM Services s
    LEFT JOIN ServiceEmployeePrice sep ON s.id = sep.service_id
  `;

  try {
    // Use async/await with the promise-enabled query
    const [results] = await req.dbPool.query(sql);
    const servicesMap = new Map(); // Using Map to group results by service ID

    // Process results
    results.forEach(row => {
      const { 
        id, 
        name, 
        category_id, 
        duration_time, 
        buffer_time,
        booking_note,
        employee_id,
        price,
      } = row;

      if (!servicesMap.has(id)) {
        servicesMap.set(id, {
          id,
          name,
          categoryId: category_id,
          durationTime: duration_time,
          bufferTime: buffer_time,
          bookingNote: booking_note,
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
  } catch (error) {
    console.error(`Database query error:`, error);
    res.status(500).json({ message: `Failed to query database` });
  }
});

router.get(`/categories`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: `Database connection not initialized` });
  }

  const sql = `
    SELECT c.id, c.name, c.img
    FROM ServiceCategories c
  `;

  try {
    const [results] = await req.dbPool.query(sql);

    const data = results.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.img ? `${process.env.SERVER_API_URL}/images/${row.img}` : null,
    }));

    res.json(data);
  } catch (error) {
    console.error(`Database query error:`, error);
    res.status(500).json({ message: `Failed to query database` });
  }
});

router.post(`/create-service`, async (req, res) => {
  const service = req.body.service;

  // Validation
  const errors = validateServiceForm(service);

  if (Object.keys(errors).length > 0) {
    return res.status(428).json({ errors });
  }

  const serviceQuery = `
    INSERT INTO Services (
      employee_id, 
      name, 
      category_id, 
      duration_time, 
      buffer_time, 
      booking_note
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const employeeIds = service.employeePrices.map(employeePrice => {
    if (employeePrice.price) {
      return employeePrice.employeeId
    }
  }).join(`,`);

  const serviceValues = [
      employeeIds,
      service.name,
      service.categoryId,
      service.durationTime,
      service.bufferTime,
      service.bookingNote,
  ];

  let serviceId;

  try {
    const [serviceResults] = await req.dbPool.query(serviceQuery, serviceValues);
    serviceId = serviceResults.insertId;

    // set price to ServiceEmployeePrice table
    if (service.employeePrices.length) {
      for (const employeePrice of service.employeePrices) {
        console.log(employeePrice);
        await saveEmployeePriceForService({ db: req.dbPool, res }, employeePrice, serviceId);
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
    SET employee_id = ?, name = ?, category_id = ?, duration_time = ?, buffer_time = ?, booking_note = ?
    WHERE id = ?;
  `;

  const employeeIds = service.employeePrices.map(employeePrice => employeePrice.employeeId).join(`,`);

  const serviceValues = [
    employeeIds,
    service.name,
    service.categoryId,
    service.durationTime,
    service.bufferTime,
    service.bookingNote,
    serviceId,
  ];

  try {
    await req.dbPool.query(updateServiceQuery, serviceValues);

    // Delete existing prices for the service
    await deleteEmployeesPriceForService({ db: req.dbPool, res }, serviceId);

    // set price to ServiceEmployeePrice table
    if (service.employeePrices.length) {
      for (const employeePrice of service.employeePrices) {
        console.log(employeePrice);
        await saveEmployeePriceForService({ db: req.dbPool, res }, employeePrice, serviceId);
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

router.put(`/category/edit/:id`, upload.single(`image`), async (req, res) => {    
  const categoryId = req.params.id;
  const { name } = req.body;

  const imgPath = `${req.file.filename}`;

  const updateServiceCategoryQuery = `
    UPDATE ServiceCategories
    SET name = ?, img = ?
    WHERE id = ?;
  `;

  const serviceValues = [
    name,
    imgPath,
    categoryId,
  ];

  try {
    await req.dbPool.query(updateServiceCategoryQuery, serviceValues);

    res.json({
        message: `Category data updated successfully`,
        data: categoryId,
    });
  } catch (error) {
    console.log(error);
    if (error.code === `ER_DUP_ENTRY`) {
      return res.status(428).json({ errors: { name: `Category with this name already exists` } });
    }
    return res.status(500).json(error);
  }
});

router.delete(`/:id`, (req, res) => {
  const serviceId = req.params.id;
  const deleteQuery = `DELETE FROM Services WHERE id = ?`;

  req.dbPool.query(deleteQuery, [serviceId], (err, results) => {
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

module.exports = router;

const deleteEmployeesPriceForService = async ({ db, res }, serviceId) => {
  try {
    // Check if there's an existing record for the employee and service
    const deleteQuery = `DELETE FROM ServiceEmployeePrice WHERE service_id = ?`;

    await db.query(deleteQuery, [serviceId]);
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

    const [existingRows] = await db.query(checkQuery, [employeePrice.employeeId, serviceId]);

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