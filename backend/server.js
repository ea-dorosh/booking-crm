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
app.use(express.static(`public`));

// routes for CRM
const authRouter = require('./routes/auth');
const appointmentsRouter = require('./routes/appointments/appointments');
const servicesRouter = require('./routes/services/services');
const employeesRouter = require('./routes/employees/employees');

// routes for client site
const servicesPublicRouter = require('./routes/services/services.public');
const employeesPublicRouter = require('./routes/employees/employees.public');
const calendarPublicRouter = require('./routes/calendar/calendar.public');
const appointmentsPublicRouter = require('./routes/appointments/appointments.public');

// Use authentication routes
app.use('/auth', authRouter);
app.use('/api/protected', databaseMiddleware);

// Use CRM routes
app.use('/api/protected/appointments', appointmentsRouter);
app.use('/api/protected/services', servicesRouter);
app.use('/api/protected/employees', employeesRouter);

// Use client site routes
app.use('/api/public/services', databaseSelectionMiddleware, servicesPublicRouter);
app.use('/api/public/employees', databaseSelectionMiddleware, employeesPublicRouter);
app.use('/api/public/calendar', databaseSelectionMiddleware, calendarPublicRouter);
app.use('/api/public/appointments', databaseSelectionMiddleware, appointmentsPublicRouter);

app.listen(port, `0.0.0.0`, () => {
  console.log(`Server is running on port ${process.env.SERVER_API_URL}`);
});