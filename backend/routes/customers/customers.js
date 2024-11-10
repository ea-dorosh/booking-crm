const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) => {
  if (!req.dbPool) {
    return res.status(500).json({ message: `Database connection not initialized` });
  }

  const sql = `
    SELECT customer_id, first_name, last_name, salutation, email, phone, added_date
    FROM Customers
  `;

  try {
    const [results] = await req.dbPool.query(sql);

    const data = results.map((row) => ({
      id: row.customer_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      addedDate: row.added_date,
    }));

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error fetching customers` });
  }
});

module.exports = router;
