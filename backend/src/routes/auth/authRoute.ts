import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  database_name?: string;
}

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'users_database',
  });

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query<UserRow[]>('SELECT * FROM Users WHERE email = ?', [email]);
    connection.release();

    if (rows.length === 0) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res.status(500).json({ message: 'JWT_SECRET not defined' });
      return;
    }

    const token = jwt.sign({ email: user.email, database: user.database_name }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'users_database',
    });

    const connection = await pool.getConnection();
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO Users (email, password, database_name) VALUES (?, ?, ?)',
      [email, hashedPassword, 'default_database']
    );
    connection.release();

    if (result.affectedRows === 1) {
      res.status(201).json({ message: 'User registered successfully.' });
    } else {
      res.status(500).json({ message: 'Failed to register user.' });
    }
  } catch (error: any) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Email already in use.' });
      return;
    }
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
