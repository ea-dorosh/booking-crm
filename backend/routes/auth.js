// routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'users_database',
  });

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
    connection.release();

    if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ email: user.email, database: user.database_name }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body; // Get email and password from request

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Connect to the database
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'users_database', // Your database name
    });

    // Insert the new user into the database
    const connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO Users (email, password, database_name) VALUES (?, ?, ?)', [email, hashedPassword, 'default_database']); // Adjust 'default_database' as needed
    connection.release();

    if (result.affectedRows === 1) {
      res.status(201).json({ message: 'User registered successfully.' });
    } else {
      res.status(500).json({ message: 'Failed to register user.' });
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // Handle duplicate entry (e.g., user already exists)
      return res.status(409).json({ message: 'Email already in use.' });
    }
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  // Ensure all fields are provided
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Email, current password, and new password are required.' });
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'users_database',
  });

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
    connection.release();

    // Check if user exists
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Verify current password
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in the database
    const [updateResult] = await pool.query('UPDATE Users SET password = ? WHERE email = ?', [hashedNewPassword, email]);

    if (updateResult.affectedRows === 1) {
      res.status(200).json({ message: 'Password changed successfully.' });
    } else {
      res.status(500).json({ message: 'Failed to change password.' });
    }
  } catch (error) {
    console.error('Error during password change:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;