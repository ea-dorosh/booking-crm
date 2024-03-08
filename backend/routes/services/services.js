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

  router.post("/", async (req, res) => {
    const service = req.body.service;
    const isUpdate = Boolean(service.id);

    // Validation
    const errors = {};

    if (!service.employeeIds || !Array.isArray(service.employeeIds) || !service.employeeIds.length) {
      errors.employeeIds = `Choose at least one empolyee for the service`;
    }

    if (!service.name || service.name.length <= 3 ) {
      errors.name = `Service name must be at least 3 characters long`;
    }

    if (!service.durationTime || service.durationTime === `00:00:00`) {
      errors.durationTime = `Duration time is required`;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(428).json({ errors });
    }

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
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(428).json({ errors: { name: `Service with this name already exists` } });
        }
        return res.status(500).json(err);
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
        res.status(500).json(err);
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
