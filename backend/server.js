const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const databaseMiddleware = require('./middlewares/databaseMiddleware');
const databaseSelectionMiddleware = require('./middlewares/databaseSelectionMiddleware');


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
const servicesPublicRouter = require('./routes/services/services.public');
const employeesPublicRouter = require('./routes/employees/employees.public');
const calendarRouter = require('./routes/calendar/calendar');
const appointmentsRouter = require('./routes/appointments/appointments');

// Use authentication routes
app.use('/auth', authRouter);
app.use('/api/protected', databaseMiddleware);

// Use CRM routes
app.use('/api/protected/services', servicesRouter);
app.use('/api/protected/admin', adminRouter);
app.use('/api/protected/employees', employeesRouter);

// Use client site routes
app.use('/api/public/services', databaseSelectionMiddleware, servicesPublicRouter);
app.use('/api/public/employees', databaseSelectionMiddleware, employeesPublicRouter);
app.use('/api/public/calendar', databaseSelectionMiddleware, calendarRouter);
app.use('/api/public/appointments', databaseSelectionMiddleware, appointmentsRouter);

app.listen(port, '192.168.178.27', () => {
  console.log(`Server is running on port ${port}`);
});
