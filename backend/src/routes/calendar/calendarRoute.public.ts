import express from 'express';
import url from 'url';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getGroupedTimeSlots } from '@/services/calendar/calendarService.js';
import { bookingOperationLogger } from '@/middlewares/loggerMiddleware.js';
import bookingLogger from '@/services/logger/loggerService.js';

const router = express.Router();

router.post(`/`, bookingOperationLogger('get_calendar_timeslots'), async (req: CustomRequestType, res: CustomResponseType) => {
  const requestStartTime = Date.now();

  if (!req.dbPool) {
    bookingLogger.dbError(`Database connection not initialized`, req.logContext);
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const parsedUrlQuery = url.parse(req.url, true)?.query;

    // getting date from query params
    const paramDate = parsedUrlQuery.date as Date_ISO_Type;

    // getting services data from request body
    const servicesData = req.body as Array<{ serviceId: number; employeeIds: number[] }>;

    const requestContext = {
      ...req.logContext,
      paramDate,
      servicesData,
      servicesCount: Array.isArray(servicesData) ? servicesData.length : 0,
    };

    bookingLogger.userAction(`Calendar timeslots request received`, requestContext);

    // Validation
    if (typeof paramDate !== `string` || !Array.isArray(servicesData) || servicesData.length === 0) {
      const errorMessage = `Invalid parameters: date must be a string and servicesData must be a non-empty array`;
      bookingLogger.validationError(errorMessage, {
        ...requestContext,
        validation: 'invalid_parameters',
        paramDateType: typeof paramDate,
        servicesDataType: typeof servicesData,
        servicesDataLength: Array.isArray(servicesData) ? servicesData.length : 'not_array',
      });

      res.status(400).json({ error: errorMessage });
      return;
    }

    // validate services data structure
    const isValidServicesData = servicesData.every(item =>
      item.serviceId &&
      Array.isArray(item.employeeIds) &&
      item.employeeIds.length > 0,
    );

    if (!isValidServicesData) {
      const errorMessage = `Invalid servicesData format: each item must have serviceId and non-empty employeeIds array`;
      bookingLogger.validationError(errorMessage, {
        ...requestContext,
        validation: 'invalid_services_structure',
        invalidServices: servicesData.filter(item =>
          !item.serviceId || !Array.isArray(item.employeeIds) || item.employeeIds.length === 0
        ),
      });

      res.status(400).json({ error: errorMessage });
      return;
    }

    bookingLogger.debug(`Calendar timeslots validation passed`, requestContext);

    const calendarStartTime = Date.now();
    const groupedTimeSlots = await getGroupedTimeSlots(req.dbPool, paramDate, servicesData);

    bookingLogger.bookingSuccess(`Calendar timeslots retrieved successfully`, {
      ...requestContext,
      calendarProcessingTime: Date.now() - calendarStartTime,
      totalRequestTime: Date.now() - requestStartTime,
      resultingSlotsCount: groupedTimeSlots.reduce(
        (total, day) => total + day.availableTimeslots.length, 0
      ),
      daysWithSlots: groupedTimeSlots.length,
    });

    res.json(groupedTimeSlots);
    return;
  } catch (error) {
    bookingLogger.calendarError(`Calendar timeslots retrieval failed`, {
      ...req.logContext,
      error: error,
      totalRequestTime: Date.now() - requestStartTime,
      step: 'calendar_route_processing',
    });

    res.status(500).json({ error: `Internal Server Error` });
    return;
  }
});

export default router;
