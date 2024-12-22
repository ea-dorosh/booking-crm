import mysql from 'mysql2/promise';
import { Request, Response, NextFunction } from 'express';
import { Pool } from 'mysql2/promise';

// This middleware selects the appropriate database based on the request's hostname
interface CustomRequest extends Request {
  dbPool?: Pool;
}

async function databaseSelectionMiddleware(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
  const hostname: string = req.hostname;

  let databaseName: string;
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
      databaseName = 'dorosh_studio_database';
  }

  req.dbPool = mysql.createPool({
    host: process.env.DB_HOST as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: databaseName,
  });
  
  next();
}

export default databaseSelectionMiddleware;