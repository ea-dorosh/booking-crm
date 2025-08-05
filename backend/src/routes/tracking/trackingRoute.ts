import express from 'express';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { getQrScanStats } from '@/services/tracking/trackingService.js';

const router = express.Router();

router.get(`/stats`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const days = request.query.days ? parseInt(request.query.days as string) : 90;
    const stats = await getQrScanStats(request.dbPool, days);

    response.json({
      message: `QR scan stats retrieved successfully`,
      data: stats
    });
  } catch (error) {
    console.error('Error getting QR scan stats:', error);
    response.status(500).json({ error: `Error getting QR scan stats` });
  }
});



export default router;