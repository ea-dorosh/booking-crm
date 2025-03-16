import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import databaseMiddleware from '@/middlewares/databaseMiddleware.js';
import databaseSelectionMiddleware from '@/middlewares/databaseSelectionMiddleware.js';

// routes for CRM
import appointmentsRouter from '@/routes/appointments/appointmentsRoute.js';
import authRouter from '@/routes/auth/authRoute.js';
import companyRouter from '@/routes/company/companyRoute.js';
import customersRouter from '@/routes/customers/customersRoute.js';
import employeesRouter from '@/routes/employees/employeesRoute.js';
import invoicesRouter from '@/routes/invoices/invoicesRoute.js';
import servicesRouter from '@/routes/services/servicesRoute.js';
import userRouter from '@/routes/user/userRoute.js';

// routes for client site
import appointmentsPublicRouter from '@/routes/appointments/appointmentsRoute.public.js';
import calendarPublicRouter from '@/routes/calendar/calendarRoute.public.js';
import employeesPublicRouter from '@/routes/employees/employeesRoute.public.js';
import servicesPublicRouter from '@/routes/services/servicesRoute.public.js';

dotenv.config();

const app = express();

app.use(morgan(`dev`));

const port = parseInt(process.env.PORT || `3500`, 10);

app.use(cors());
app.use(express.json());
app.use(express.static(`public`));

app.use(`/images`, express.static(`public/images`, {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Use authentication routes
app.use(`/auth`, authRouter);

// Use CRM routes
app.use(`/api/protected/appointments`, databaseMiddleware, appointmentsRouter);
app.use(`/api/protected/company`, databaseMiddleware, companyRouter);
app.use(`/api/protected/customers`, databaseMiddleware, customersRouter);
app.use(`/api/protected/employees`, databaseMiddleware, employeesRouter);
app.use(`/api/protected/invoices`, databaseMiddleware, invoicesRouter);
app.use(`/api/protected/services`, databaseMiddleware, servicesRouter);
app.use(`/api/protected/user`, databaseMiddleware, userRouter);

// Use client site routes
app.use(`/api/public/appointments`, databaseSelectionMiddleware, appointmentsPublicRouter);
app.use(`/api/public/calendar`, databaseSelectionMiddleware, calendarPublicRouter);
app.use(`/api/public/employees`, databaseSelectionMiddleware, employeesPublicRouter);
app.use(`/api/public/services`, databaseSelectionMiddleware, servicesPublicRouter);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on internal port ${port} and externally accessible as ${process.env.SERVER_API_URL}`);
});