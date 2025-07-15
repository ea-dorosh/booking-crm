import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import { Response, NextFunction } from 'express';
import { CustomRequestType } from '@/@types/expressTypes.js';
import { Pool } from 'mysql2/promise';

interface DecodedToken {
  database: string;
}

// Global pool cache to reuse connections
const poolCache = new Map<string, Pool>();

export default async function databaseMiddleware(
  req: CustomRequestType,
  res: Response,
  next: NextFunction
): Promise<void> {
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

    // Check if pool already exists for this database
    if (!poolCache.has(decoded.database)) {
      poolCache.set(decoded.database, mysql.createPool({
        host: process.env.DB_HOST as string,
        user: process.env.DB_USER as string,
        password: process.env.DB_PASSWORD as string,
        database: decoded.database,
        connectionLimit: 10,
      }));
    }

    req.dbPool = poolCache.get(decoded.database);

    next();
  } catch (error) {
    console.error(`Middleware error:`, error);
    res.status(401).json({ message: `Invalid or expired token` });
  }
}
