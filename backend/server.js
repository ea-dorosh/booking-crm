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

const servicesRouter = require('./routes/services/services')(db);
const adminRouter = require('./routes/admin/admin')(db);
const calendarRouter = require('./routes/calendar/calendar')(db);
const appointmentsRouter = require('./routes/appointments/appointments')(db);
const employeesRouter = require('./routes/employees/employees')(db);

app.use('/api/services', servicesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/employees', employeesRouter);

app.listen(port, '192.168.178.27', () => {
  console.log(`Server is running on port ${port}`);
});
