import express from 'express';
import url from 'url';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getGroupedTimeSlots } from '@/services/calendar/calendarService.js';

const router = express.Router();

router.post(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const parsedUrlQuery = url.parse(req.url, true)?.query;

    // getting date from query params
    const paramDate = parsedUrlQuery.date as Date_ISO_Type;

    // getting services data from request body
    const servicesData = req.body as Array<{ serviceId: number; employeeIds: number[] }>;

    if (typeof paramDate !== `string` || !Array.isArray(servicesData) || servicesData.length === 0) {
      res.status(400).json({
        error: `Invalid parameters: date must be a string and servicesData must be a non-empty array`,
      });
      return;
    }

    // validate services data structure
    const isValidServicesData = servicesData.every(item =>
      item.serviceId &&
      Array.isArray(item.employeeIds) &&
      item.employeeIds.length > 0,
    );

    if (!isValidServicesData) {
      res.status(400).json({
        error: `Invalid servicesData format: each item must have serviceId and non-empty employeeIds array`,
      });
      return;
    }

    const groupedTimeSlots = await getGroupedTimeSlots(req.dbPool, paramDate, servicesData);

    res.json(groupedTimeSlots);
    return;
  } catch (error) {
    console.error(`Error:`, error);
    res.status(500).json({ error: `Internal Server Error` });

    return;
  }
});

export default router;
