import express from 'express';
import url from 'url';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';
import { getGroupedTimeSlots } from '@/services/calendar/calendarService.js';

const router = express.Router();

router.get(`/`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const parsedUrlQuery = url.parse(req.url, true)?.query;

    // getting request query params
    const paramDate = parsedUrlQuery.date as Date_ISO_Type;
    const serviceId = Number(parsedUrlQuery.serviceId);
    const employeeIds = (parsedUrlQuery.employeeIds as string).split(`,`).map(Number);

    if (typeof paramDate !== `string` || !serviceId || employeeIds.length === 0) {
      res.status(400).json({
        error: `Invalid parameters: date must be a string, serviceId must be provided, and employeeIds cannot be empty`
      });
      return;
    }

    const groupedTimeSlots = await getGroupedTimeSlots(req.dbPool, paramDate, serviceId, employeeIds);

    res.json(groupedTimeSlots);
    return;
  } catch (error) {
    console.error(`Error:`, error);
    res.status(500).json({ error: `Internal Server Error` });

    return;
  }
});

export default router;
