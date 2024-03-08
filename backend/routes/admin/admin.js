const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/days', (req, res) => {
    const sql = 'SELECT day_id, day_name FROM DaysOfWeek';

    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error fetching DaysOfWeek' });
      } else {
        const data = results.map((row) => ({
          dayId: row.day_id,
          dayName: row.day_name,
        }));
        res.json(data);
      }
    });
  });

  return router;
};
