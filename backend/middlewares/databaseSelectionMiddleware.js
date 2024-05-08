const mysql = require('mysql2/promise');

// This middleware selects the appropriate database based on the request's hostname
async function databaseSelectionMiddleware(req, res, next) {
  console.log(`req`, req);
  console.log("Starting database selection middleware");
  const hostname = req.hostname;
  console.log("Hostname:", hostname);

  let databaseName;
  switch (hostname) {
    case 'www.barber.com':
      databaseName = 'barberDatabase';
      break;
    case 'www.beauty.com':
      databaseName = 'beautyDatabase';
      break;
    default:
      // Handle unknown or unspecified hostnames
      // return res.status(400).json({ message: "Invalid hostname" });
      databaseName = 'first_egors_database';
  }

  req.dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName,
  });

  console.log("Database pool created for", databaseName, "- proceeding to next middleware/route");
  next();
}

module.exports = databaseSelectionMiddleware;