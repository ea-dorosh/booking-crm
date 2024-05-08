const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: "Database connection not initialized" });
  }

  const sql = `
    SELECT s.id, s.name, s.duration_time, s.buffer_time, sep.employee_id, sep.price
    FROM Services s
    LEFT JOIN ServiceEmployeePrice sep ON s.id = sep.service_id
  `;

  try {
    // Use async/await with the promise-enabled query
    const [results] = await req.dbPool.query(sql);
    const servicesMap = new Map(); // Using Map to group results by service ID

    // Process results
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
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ message: "Failed to query database" });
  }
});

module.exports = router;