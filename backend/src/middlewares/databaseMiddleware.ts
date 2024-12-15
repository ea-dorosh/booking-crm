import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import { Response, NextFunction } from 'express';
import { CustomRequestType } from '@/@types/expressTypes';

interface DecodedToken {
  database: string;
}

export default async function databaseMiddleware(req: CustomRequestType, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: `No token provided` });
    return;
  }

  try {
      if (!process.env.JWT_SECRET) {
        throw new Error(`JWT_SECRET is not defined`);
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as unknown as DecodedToken;

      req.dbPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: decoded.database,
      });

      next();
  } catch (error) {
      console.error(`Middleware error:`, error);
      res.status(401).json({ message: `Invalid or expired token` });
  }
}
