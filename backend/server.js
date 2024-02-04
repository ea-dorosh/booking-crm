const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Use Morgan for logging HTTP requests
app.use(morgan('dev'));

const port = process.env.PORT || 3500;

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

app.use(cors()); 
app.use(express.json());

const servicesRouter = require('./routes/services')(db); // Pass the db object
const adminRouter = require('./routes/admin')(db); // Pass the db object
const calendarRouter = require('./routes/calendar')(db); // Pass the db object

app.use('/api/services', servicesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/calendar', calendarRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
