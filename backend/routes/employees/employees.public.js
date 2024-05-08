const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: "Database connection not initialized" });
  }

  const sql = `SELECT employee_id, first_name, last_name, email, phone FROM Employees`;

  try {
    const [results] = await req.dbPool.query(sql);

    const data = results.map((row) => ({
      employeeId: row.employee_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
    }));

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching employees` });
  }
});

module.exports = router;
