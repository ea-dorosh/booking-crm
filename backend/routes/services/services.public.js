const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: `Database connection not initialized` });
  }

  // get service categories
  const categoriesSql = `
    SELECT c.id, c.name
    FROM ServiceCategories c
  `;

  const [categoriesResult] = await req.dbPool.query(categoriesSql);

  const categoriesData = categoriesResult.map((row) => ({
    id: row.id,
    name: row.name,
  }));


  // get all services and map with categories and employee prices
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
          categoryName: categoriesData.find(category => category.id === category_id).name,
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

module.exports = router;