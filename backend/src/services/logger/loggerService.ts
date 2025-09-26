import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const logColors = {
  error: `red`,
  warn: `yellow`,
  info: `green`,
  http: `magenta`,
  debug: `white`,
};

// Add colors to winston
winston.addColors(logColors);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), `logs`);

// Common format for all transports
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: `YYYY-MM-DD HH:mm:ss:ms` }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint(),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: `YYYY-MM-DD HH:mm:ss:ms` }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.stack || ``}`,
  ),
);

// Create the transports array
const transports: winston.transport[] = [];

// Console transport for development
if (process.env.NODE_ENV !== `production`) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// File transport for all logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, `combined-%DATE%.log`),
    datePattern: `YYYY-MM-DD`,
    zippedArchive: true,
    maxSize: `20m`,
    maxFiles: `14d`,
    format: logFormat,
  }),
);

// File transport for error logs only
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, `error-%DATE%.log`),
    datePattern: `YYYY-MM-DD`,
    zippedArchive: true,
    maxSize: `20m`,
    maxFiles: `30d`,
    level: `error`,
    format: logFormat,
  }),
);

// File transport for booking-specific logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, `booking-%DATE%.log`),
    datePattern: `YYYY-MM-DD`,
    zippedArchive: true,
    maxSize: `20m`,
    maxFiles: `30d`,
    format: logFormat,
  }),
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === `production` ? `info` : `debug`,
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Helper interface for structured logging
export interface LogContext {
  userId?: number;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  employeeId?: number;
  serviceId?: number;
  appointmentId?: number;
  companyDomain?: string;
  error?: Error;
  stack?: string;
  [key: string]: any;
}

// Enhanced logger class with booking-specific methods
class BookingLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = logger;
  }

  // General logging methods
  error(message: string, context?: LogContext): void {
    this.logger.error(message, {
      ...context, timestamp: new Date().toISOString(),
    });
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, {
      ...context, timestamp: new Date().toISOString(),
    });
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, {
      ...context, timestamp: new Date().toISOString(),
    });
  }

  http(message: string, context?: LogContext): void {
    this.logger.http(message, {
      ...context, timestamp: new Date().toISOString(),
    });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, {
      ...context, timestamp: new Date().toISOString(),
    });
  }

  // Booking-specific logging methods
  bookingError(message: string, context: LogContext & {
    step?: string;
    serviceIds?: number[];
    employeeIds?: number[];
    selectedDate?: string;
    timeSlot?: string;
    customerData?: any;
  }): void {
    this.logger.error(`[BOOKING_ERROR] ${message}`, {
      ...context,
      category: `booking`,
      timestamp: new Date().toISOString(),
    });
  }

  bookingSuccess(message: string, context: LogContext & {
    appointmentId?: number;
    serviceIds?: number[];
    employeeIds?: number[];
    selectedDate?: string;
    timeSlot?: string;
    customerEmail?: string;
  }): void {
    this.logger.info(`[BOOKING_SUCCESS] ${message}`, {
      ...context,
      category: `booking`,
      timestamp: new Date().toISOString(),
    });
  }

  calendarError(message: string, context: LogContext & {
    operation?: string;
    dateRange?: string;
    employeeIds?: number[];
    serviceId?: number;
  }): void {
    this.logger.error(`[CALENDAR_ERROR] ${message}`, {
      ...context,
      category: `calendar`,
      timestamp: new Date().toISOString(),
    });
  }

  validationError(message: string, context: LogContext & {
    field?: string;
    value?: any;
    validation?: string;
  }): void {
    this.logger.warn(`[VALIDATION_ERROR] ${message}`, {
      ...context,
      category: `validation`,
      timestamp: new Date().toISOString(),
    });
  }

  dbError(message: string, context: LogContext & {
    query?: string;
    table?: string;
    operation?: string;
  }): void {
    this.logger.error(`[DATABASE_ERROR] ${message}`, {
      ...context,
      category: `database`,
      timestamp: new Date().toISOString(),
    });
  }

  apiError(message: string, context: LogContext): void {
    this.logger.error(`[API_ERROR] ${message}`, {
      ...context,
      category: `api`,
      timestamp: new Date().toISOString(),
    });
  }

  userAction(action: string, context: LogContext): void {
    this.logger.info(`[USER_ACTION] ${action}`, {
      ...context,
      category: `user_action`,
      timestamp: new Date().toISOString(),
    });
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.logger.info(`[PERFORMANCE] ${operation} took ${duration}ms`, {
      ...context,
      category: `performance`,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  // External API logging
  externalApi(service: string, operation: string, context: LogContext & {
    responseStatus?: number;
    responseTime?: number;
    requestData?: any;
    responseData?: any;
  }): void {
    this.logger.info(`[EXTERNAL_API] ${service} - ${operation}`, {
      ...context,
      category: `external_api`,
      timestamp: new Date().toISOString(),
    });
  }

  // Google Calendar specific logging
  googleCalendar(operation: string, context: LogContext & {
    employeeId?: number;
    calendarId?: string;
    eventId?: string;
    dateRange?: string;
  }): void {
    this.logger.info(`[GOOGLE_CALENDAR] ${operation}`, {
      ...context,
      category: `google_calendar`,
      timestamp: new Date().toISOString(),
    });
  }
}

// Create and export singleton instance
const bookingLogger = new BookingLogger();

export { bookingLogger };
export default bookingLogger;
