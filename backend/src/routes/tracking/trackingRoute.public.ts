import express from 'express';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { saveQrScan, QrScanData } from '@/services/tracking/trackingService.js';

function getClientIpFromRequest(req: express.Request): string | undefined {
  // Common proxy/CDN headers precedence
  const xForwardedFor = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  const cfConnectingIp = req.headers['cf-connecting-ip'] as string | undefined;
  const xRealIp = req.headers['x-real-ip'] as string | undefined;

  // Express will respect X-Forwarded-* if trust proxy is enabled
  const expressIp = req.ip;
  const socketIp = req.socket?.remoteAddress;

  return xForwardedFor || cfConnectingIp || xRealIp || expressIp || socketIp || undefined;
}

const router = express.Router();

router.post(`/qr-scan`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
      console.log('QR DEBUG BE: incoming headers', {
        'x-forwarded-for': request.headers['x-forwarded-for'],
        'x-real-ip': request.headers['x-real-ip'],
        'cf-connecting-ip': request.headers['cf-connecting-ip'],
        'user-agent': request.headers['user-agent'],
        referer: request.headers['referer'],
      });

    const clientIp = getClientIpFromRequest(request);

      console.log('QR DEBUG BE: resolved IPs', {
        clientIp,
        expressIp: request.ip,
        socketIp: request.socket?.remoteAddress,
      });
    const scanData: QrScanData = {
      userAgent: request.headers['user-agent'] || undefined,
      ipAddress: clientIp,
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

      console.log('QR DEBUG BE: scanData to save', {
        ipAddress: scanData.ipAddress,
        hasDeviceInfo: Boolean(scanData.deviceInfo),
        source: (scanData.deviceInfo as any)?.source,
      });

    const result = await saveQrScan(request.dbPool, scanData);

      console.log('QR DEBUG BE: saved record', {
        id: result.id,
        ip: result.ip_address,
        scanned_at: result.scanned_at,
      });

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