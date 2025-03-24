import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';
import { sendPasswordResetEmail } from '@/mailer/mailer.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const router = express.Router();

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  database_name?: string;
}

interface ResetTokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
}

// Create user database connection pool
function createUserDbPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'users_database',
  });
}

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const pool = createUserDbPool();

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
  } finally {
    await pool.end();
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

    const pool = createUserDbPool();

    const connection = await pool.getConnection();
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO Users (email, password, database_name) VALUES (?, ?, ?)',
      [email, hashedPassword, 'default_database']
    );
    connection.release();

    await pool.end();

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

// Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const pool = createUserDbPool();

  try {
    // Check if user exists
    const connection = await pool.getConnection();
    const [users] = await connection.query<UserRow[]>('SELECT * FROM Users WHERE email = ?', [email]);

    // Always return successful response to avoid email enumeration
    if (users.length === 0) {
      connection.release();
      await pool.end();
      return res.json({
        message: 'If the email exists in our system, a password reset link has been sent.'
      });
    }

    const user = users[0];
    const resetToken = uuidv4();

    // Set token expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete any existing reset tokens for this user
    await connection.query(
      'DELETE FROM PasswordResetTokens WHERE user_id = ?',
      [user.id]
    );

    // Insert new reset token
    await connection.query(
      'INSERT INTO PasswordResetTokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    connection.release();

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    res.json({
      message: 'If the email exists in our system, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Error during password reset request:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await pool.end();
  }
});

// Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      message: 'Token and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long'
    });
  }

  const pool = createUserDbPool();

  try {
    const connection = await pool.getConnection();

    // Find valid token
    const [tokens] = await connection.query<ResetTokenRow[]>(
      'SELECT * FROM PasswordResetTokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      connection.release();
      return res.status(400).json({
        message: 'Invalid or expired token'
      });
    }

    const resetToken = tokens[0];

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await connection.query(
      'UPDATE Users SET password = ? WHERE id = ?',
      [hashedPassword, resetToken.user_id]
    );

    // Delete used token
    await connection.query(
      'DELETE FROM PasswordResetTokens WHERE id = ?',
      [resetToken.id]
    );

    connection.release();

    res.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await pool.end();
  }
});

export default router;
