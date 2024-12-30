import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import databaseMiddleware from '@/middlewares/databaseMiddleware';
import databaseSelectionMiddleware from '@/middlewares/databaseSelectionMiddleware';

// routes for CRM
import appointmentsRouter from '@/routes/appointments/appointmentsRoute';
import authRouter from '@/routes/auth/authRoute';
import customersRouter from '@/routes/customers/customersRoute';
import employeesRouter from '@/routes/employees/employeesRoute';
import invoicesRouter from '@/routes/invoices/invoicesRoute';
import servicesRouter from '@/routes/services/servicesRoute';

// routes for client site
import appointmentsPublicRouter from '@/routes/appointments/appointmentsRoute.public';
import calendarPublicRouter from '@/routes/calendar/calendarRoute.public';
import employeesPublicRouter from '@/routes/employees/employeesRoute.public';
import servicesPublicRouter from '@/routes/services/servicesRoute.public';

dotenv.config();

const app = express();

app.use(morgan(`dev`));

const port = parseInt(process.env.PORT || `3500`, 10);

app.use(cors());
app.use(express.json());
app.use(express.static(`public`));

// Use authentication routes
app.use(`/auth`, authRouter);
app.use(`/api/protected`, databaseMiddleware);

// Use CRM routes
app.use(`/api/protected/appointments`, databaseSelectionMiddleware, appointmentsRouter);
app.use(`/api/protected/customers`, databaseSelectionMiddleware, customersRouter);
app.use(`/api/protected/employees`, databaseSelectionMiddleware, employeesRouter);
app.use(`/api/protected/invoices`, databaseSelectionMiddleware, invoicesRouter);
app.use(`/api/protected/services`, databaseSelectionMiddleware, servicesRouter);

// Use client site routes
app.use(`/api/public/appointments`, databaseSelectionMiddleware, appointmentsPublicRouter);
app.use(`/api/public/calendar`, databaseSelectionMiddleware, calendarPublicRouter);
app.use(`/api/public/employees`, databaseSelectionMiddleware, employeesPublicRouter);
app.use(`/api/public/services`, databaseSelectionMiddleware, servicesPublicRouter);

app.listen(port, `0.0.0.0`, () => {
  console.log(`Server is running on port ${process.env.SERVER_API_URL}`);
});