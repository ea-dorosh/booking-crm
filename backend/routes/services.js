const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/", (req, res) => {
    // Use the db object to query for services

    const sql =
      "SELECT id, name, employee_id, duration_time, buffer_time FROM Services";

    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).json({ error: "Error fetching services" });
      } else {
        const data = results.map((row) => ({
          id: row.id,
          name: row.name,
          employeeIds: row.employee_id
            ? row.employee_id.split(",").map(Number)
            : [],
          durationTime: row.duration_time,
          bufferTime: row.buffer_time,
        }));
        res.json(data);
      }
    });
  });

  router.post("/", (req, res) => {
    const service = req.body.service;
    const isUpdate = Boolean(service.id);

    const query = isUpdate
      ? `
        UPDATE Services
        SET employee_id = ?, name = ?, duration_time = ?, buffer_time = ?
        WHERE id = ?;
      `
      : `
        INSERT INTO Services (employee_id, name, duration_time, buffer_time)
        VALUES (?, ?, ?, ?)
      `;

    const values = isUpdate
      ? [
          Array.isArray(service.employeeIds)
            ? service.employeeIds.join(",")
            : "",
          service.name,
          service.durationTime,
          service.bufferTime,
          service.id,
        ]
      : [
          Array.isArray(service.employeeIds)
            ? service.employeeIds.join(",")
            : "",
          service.name,
          service.durationTime,
          service.bufferTime,
        ];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        const action = isUpdate ? "updated" : "inserted";
        res.json({ message: `Service data ${action} successfully` });
      }
    });
  });

  router.delete("/:id", (req, res) => {
    const serviceId = req.params.id;
    const deleteQuery = "DELETE FROM Services WHERE id = ?";

    db.query(deleteQuery, [serviceId], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      
      if (results.affectedRows === 0) {
        res.status(404).json({ error: "Service not found" });
      } else {
        res.status(200).json({ message: "Service deleted successfully" });
      }
    });
  });

  return router;
};
