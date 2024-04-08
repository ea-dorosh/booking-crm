const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const databaseMiddleware = require('./middlewares/databaseMiddleware');

dotenv.config();

const app = express();

app.use(morgan('dev'));

const port = process.env.PORT || 3500;

app.use(cors());
app.use(express.json());

// routes for CRM
const authRouter = require('./routes/auth');
const servicesRouter = require('./routes/services/services');
const adminRouter = require('./routes/admin/admin');
const employeesRouter = require('./routes/employees/employees');

// routes for client site
const calendarRouter = require('./routes/calendar/calendar');
const appointmentsRouter = require('./routes/appointments/appointments');

// Use authentication routes
app.use('/auth', authRouter);
app.use('/api', databaseMiddleware);

// Use CRM routes
app.use('/api/services', servicesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/employees', employeesRouter);

// Use client site routes
app.use('/api/calendar', calendarRouter);
app.use('/api/appointments', appointmentsRouter);

app.listen(port, '192.168.178.27', () => {
  console.log(`Server is running on port ${port}`);
});
