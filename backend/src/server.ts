import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import databaseMiddleware from '@/middlewares/databaseMiddleware.js';
import databaseSelectionMiddleware from '@/middlewares/databaseSelectionMiddleware.js';
import { initScheduler } from '@/services/scheduler/schedulerService.js';
import mysql from 'mysql2/promise';
import path from "path";
import { dayjs } from '@/services/dayjs/dayjsService.js';

// routes for CRM
import appointmentsRouter from '@/routes/appointments/appointmentsRoute.js';
import authRouter from '@/routes/auth/authRoute.js';
import companyRouter from '@/routes/company/companyRoute.js';
import customersRouter from '@/routes/customers/customersRoute.js';
import employeesRouter from '@/routes/employees/employeesRoute.js';
import googleCalendarRouter from '@/routes/googleCalendar/googleCalendarRoute.js';
import invoicesRouter from '@/routes/invoices/invoicesRoute.js';
import servicesRouter from '@/routes/services/servicesRoute.js';
import trackingRouter from '@/routes/tracking/trackingRoute.js';
import userRouter from '@/routes/user/userRoute.js';

// routes for client site
import appointmentsPublicRouter from '@/routes/appointments/appointmentsRoute.public.js';
import calendarPublicRouter from '@/routes/calendar/calendarRoute.public.js';
import companyPublicRouter from '@/routes/company/companyRoute.public.js';
import employeesPublicRouter from '@/routes/employees/employeesRoute.public.js';
import servicesPublicRouter from '@/routes/services/servicesRoute.public.js';
import trackingPublicRouter from '@/routes/tracking/trackingRoute.public.js';

const envFile = process.env.NODE_ENV === `production`
  ? `.env.production`
  : `.env.development`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const app = express();

// Trust reverse proxies so req.ip and X-Forwarded-* are respected
app.set('trust proxy', true);

app.use(morgan(`dev`));

const port = parseInt(process.env.PORT || `3500`, 10);

const allowedOrigins = [
  `http://localhost:3000`,
  `http://localhost:3001`,
  `http://127.0.0.1:3000`,
  `http://192.168.178.40:3000`,
  process.env.PRODUCTION_CLIENT_URL,
  process.env.PRODUCTION_ADMIN_URL,
  process.env.STUDIO_CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: function(origin: string | undefined, callback: (_err: Error | null, allow?: boolean) => void) {
    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'development' || allowedOrigins.some(allowedOrigin => origin.startsWith(String(allowedOrigin)))) {
      return callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  methods: [`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.static(`public`));

app.use(`/images`, express.static(`public/images`, {
  setHeaders: (res) => {
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
app.use(`/api/protected/google-calendar`, databaseMiddleware, googleCalendarRouter);
app.use(`/api/protected/invoices`, databaseMiddleware, invoicesRouter);
app.use(`/api/protected/services`, databaseMiddleware, servicesRouter);
app.use(`/api/protected/tracking`, databaseMiddleware, trackingRouter);
app.use(`/api/protected/user`, databaseMiddleware, userRouter);

// Use client site routes
app.use(`/api/public/appointments`, databaseSelectionMiddleware, appointmentsPublicRouter);
app.use(`/api/public/calendar`, databaseSelectionMiddleware, calendarPublicRouter);
app.use(`/api/public/company`, databaseSelectionMiddleware, companyPublicRouter);
app.use(`/api/public/employees`, databaseSelectionMiddleware, employeesPublicRouter);
app.use(`/api/public/services`, databaseSelectionMiddleware, servicesPublicRouter);
app.use(`/api/public/tracking`, databaseSelectionMiddleware, trackingPublicRouter);

app.listen(port, `0.0.0.0`, () => {
  console.log(`Server is running on internal port ${port} and externally accessible as ${process.env.SERVER_API_URL}`);

  try {
    const schedulerDbPool = mysql.createPool({
      host: process.env.DB_HOST as string,
      user: process.env.DB_USER as string,
      password: process.env.DB_PASSWORD as string,
      database: process.env.DB_SCHEDULER_DATABASE || process.env.DB_DEFAULT_DATABASE,
    });

    initScheduler(schedulerDbPool);
  } catch (error) {
    console.error(`Failed to initialize scheduler:`, error);
  }

  console.log(`Server timezone info:`, {
    timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currentTime: new Date().toISOString(),
    currentLocalTime: new Date().toString(),
    dayjsTimezone: dayjs.tz.guess()
  });
});
