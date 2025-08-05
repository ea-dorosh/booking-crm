import express from 'express';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { saveQrScan, QrScanData } from '@/services/tracking/trackingService.js';

const router = express.Router();

router.post(`/qr-scan`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const scanData: QrScanData = {
      userAgent: request.headers['user-agent'] || undefined,
      ipAddress: request.ip || request.socket?.remoteAddress || undefined,
      referrer: request.headers.referer || undefined,
      deviceInfo: request.body.source === 'server-side' ? {
        source: 'server-side',
        trackedAt: request.body.trackedAt
      } : {
        screenWidth: request.body.screenWidth,
        screenHeight: request.body.screenHeight,
        language: request.body.language,
        timezone: request.body.timezone,
        isMobile: request.body.isMobile,
        platform: request.body.platform,
      }
    };

    const result = await saveQrScan(request.dbPool, scanData);

    response.json({
      message: `QR scan tracked successfully`,
      data: {
        id: result.id,
        scannedAt: result.scanned_at
      }
    });
  } catch (error) {
    console.error('Error tracking QR scan:', error);
    response.status(500).json({ error: `Error tracking QR scan` });
  }
});

export default router;