// authRoute.ts
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

router.get('/', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { email: string };

    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'users_database',
    });

    const connection = await pool.getConnection();
    const [rows] = await connection.query<UserRow[]>('SELECT id, email, database_name FROM Users WHERE email = ?', [decoded.email]);
    connection.release();

    if (rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const user = rows[0];
    res.json(user);
    return;
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
});

router.post('/change-password', async (req: Request, res: Response) => {
  const { email, currentPassword, newPassword } = req.body as { email?: string; currentPassword?: string; newPassword?: string };

  if (!email || !currentPassword || !newPassword) {
    res.status(400).json({ message: 'Email, current password, and new password are required.' });
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
      res.status(401).json({ errorMessage: 'Invalid credentials' });
      return;
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      res.status(401).json({ errorMessage: 'Invalid current password' });
      return;
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    const [updateResult] = await pool.query<ResultSetHeader>('UPDATE Users SET password = ? WHERE email = ?', [hashedNewPassword, email]);

    if (updateResult.affectedRows === 1) {
      res.status(200).json({ message: 'Password changed successfully.' });
    } else {
      res.status(500).json({ message: 'Failed to change password.' });
    }
  } catch (error: unknown) {
    console.error('Error during password change:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
