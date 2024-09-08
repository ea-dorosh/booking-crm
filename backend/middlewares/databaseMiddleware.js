const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

async function databaseMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
      return res.status(401).json({ message: "No token provided" });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.dbPool = mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: decoded.database,
      });

      next();
  } catch (error) {
      console.error("Middleware error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = databaseMiddleware;