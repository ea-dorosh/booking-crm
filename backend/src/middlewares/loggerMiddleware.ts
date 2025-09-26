import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bookingLogger, { LogContext } from '@/services/logger/loggerService.js';

// Extend Express Request to include our custom properties
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      logContext: LogContext;
    }
  }
}

/**
 * Middleware for logging all HTTP requests and responses
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Create base log context
  req.logContext = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    companyDomain: req.headers.domain as string,
  };

  // Log incoming request
  bookingLogger.http(`Incoming ${req.method} request`, {
    ...req.logContext,
    headers: filterSensitiveHeaders(req.headers),
    query: req.query,
    body: filterSensitiveBody(req.body),
  });

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(obj: any) {
    const responseTime = Date.now() - req.startTime;

    // Log response
    bookingLogger.http(`Response sent`, {
      ...req.logContext,
      statusCode: res.statusCode,
      responseTime,
      responseSize: JSON.stringify(obj).length,
    });

    // Log performance if slow
    if (responseTime > 1000) {
      bookingLogger.performance(`Slow request`, responseTime, req.logContext);
    }

    return originalJson.call(this, obj);
  };

  // Handle response finish for non-JSON responses
  res.on('finish', () => {
    if (!res.headersSent) return;

    const responseTime = Date.now() - req.startTime;

    bookingLogger.http(`Request completed`, {
      ...req.logContext,
      statusCode: res.statusCode,
      responseTime,
    });

    // Log performance if slow
    if (responseTime > 1000) {
      bookingLogger.performance(`Slow request`, responseTime, req.logContext);
    }
  });

  next();
};

/**
 * Error handling middleware for logging errors
 */
export const errorLoggerMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const context: LogContext = {
    ...req.logContext,
    error: error,
    stack: error.stack,
  };

  // Log different types of errors
  if (res.statusCode >= 500) {
    bookingLogger.error(`Server error occurred`, context);
  } else if (res.statusCode >= 400) {
    bookingLogger.warn(`Client error occurred`, context);
  } else {
    bookingLogger.error(`Unexpected error occurred`, context);
  }

  next(error);
};

/**
 * Middleware for logging booking-specific operations
 */
export const bookingOperationLogger = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Extract booking-related data from request
    const bookingContext = {
      ...req.logContext,
      operation,
      serviceIds: req.body?.serviceIds || req.query?.serviceIds,
      employeeIds: req.body?.employeeIds || req.query?.employeeIds,
      selectedDate: req.body?.date || req.query?.date,
      timeSlot: req.body?.timeSlot || req.query?.timeSlot,
      appointmentId: req.params?.appointmentId || req.body?.appointmentId,
    };

    bookingLogger.info(`Booking operation started: ${operation}`, bookingContext);

    // Override res.json to log operation completion
    const originalJson = res.json;
    res.json = function(obj: any) {
      const duration = Date.now() - startTime;

      if (res.statusCode >= 400) {
        bookingLogger.bookingError(`Booking operation failed: ${operation}`, {
          ...bookingContext,
          statusCode: res.statusCode,
          duration,
          response: obj,
        });
      } else {
        bookingLogger.bookingSuccess(`Booking operation completed: ${operation}`, {
          ...bookingContext,
          statusCode: res.statusCode,
          duration,
          response: obj,
        });
      }

      return originalJson.call(this, obj);
    };

    next();
  };
};

/**
 * Filter sensitive information from headers
 */
function filterSensitiveHeaders(headers: any): any {
  const filtered = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  sensitiveHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[FILTERED]';
    }
  });

  return filtered;
}

/**
 * Filter sensitive information from request body
 */
function filterSensitiveBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const filtered = { ...body };
  const sensitiveFields = ['password', 'token', 'creditCard', 'ssn', 'email'];

  function filterRecursive(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => filterRecursive(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          result[key] = '[FILTERED]';
        } else {
          result[key] = filterRecursive(value);
        }
      }
      return result;
    }

    return obj;
  }

  return filterRecursive(filtered);
}

export default requestLoggerMiddleware;
