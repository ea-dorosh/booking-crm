const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

async function databaseMiddleware(req, res, next) {
  console.log("Starting database middleware");
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
      console.log("No token provided - exiting middleware");
      return res.status(401).json({ message: "No token provided" });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);
      req.dbPool = mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: decoded.database,
      });
      console.log("Database pool created - proceeding to next middleware/route");
      next();
  } catch (error) {
      console.error("Middleware error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = databaseMiddleware;