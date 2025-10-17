import express from 'express';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import { saveQrScan, QrScanData, saveLinkClick, saveCouponQrScan } from '@/services/tracking/trackingService.js';

function getClientIpFromRequest(req: express.Request): string | undefined {
  // Common proxy/CDN headers precedence
  const xForwardedFor = (req.headers[`x-forwarded-for`] as string | undefined)?.split(`,`)[0]?.trim();
  const cfConnectingIp = req.headers[`cf-connecting-ip`] as string | undefined;
  const xRealIp = req.headers[`x-real-ip`] as string | undefined;

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
    const clientIp = getClientIpFromRequest(request);

    const scanData: QrScanData = {
      userAgent: request.headers[`user-agent`] || undefined,
      ipAddress: clientIp,
      referrer: request.headers.referer || undefined,
      deviceInfo: request.body.source === `server-side` ? {
        source: `server-side`,
        trackedAt: request.body.trackedAt,
      } : {
        screenWidth: request.body.screenWidth,
        screenHeight: request.body.screenHeight,
        language: request.body.language,
        timezone: request.body.timezone,
        isMobile: request.body.isMobile,
        platform: request.body.platform,
      },
    };

    const result = await saveQrScan(request.dbPool, scanData);

    response.json({
      message: `QR scan tracked successfully`,
      data: {
        id: result.id,
        scannedAt: result.scanned_at,
      },
    });
  } catch (error) {
    console.error(`Error tracking QR scan:`, error);
    response.status(500).json({ error: `Error tracking QR scan` });
  }
});

/** Track vanity link clicks (e.g., instagram) */
router.post(`/link-click`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const clientIp = getClientIpFromRequest(request);

    const result = await saveLinkClick(request.dbPool, {
      userAgent: request.headers[`user-agent`] || undefined,
      ipAddress: clientIp,
      referrer: request.headers.referer || undefined,
      channel: request.body.channel || `unknown`,
      target: request.body.target || `/booking`,
      clickedAt: request.body.linkedAt,
    });

    response.json({
      message: `Link click tracked successfully`,
      data: {
        id: result.id,
        clickedAt: result.clicked_at,
      },
    });
  } catch (error) {
    console.error(`Error tracking link click:`, error);
    response.status(500).json({ error: `Error tracking link click` });
  }
});

/** Track coupon QR code scans */
router.post(`/coupon-qr-scan`, async (request: CustomRequestType, response: CustomResponseType) => {
  if (!request.dbPool) {
    response.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const clientIp = getClientIpFromRequest(request);

    const scanData: QrScanData = {
      userAgent: request.headers[`user-agent`] || undefined,
      ipAddress: clientIp,
      referrer: request.headers.referer || undefined,
      deviceInfo: request.body.source === `server-side` ? {
        source: `server-side`,
        trackedAt: request.body.trackedAt,
      } : {
        screenWidth: request.body.screenWidth,
        screenHeight: request.body.screenHeight,
        language: request.body.language,
        timezone: request.body.timezone,
        isMobile: request.body.isMobile,
        platform: request.body.platform,
      },
    };

    const result = await saveCouponQrScan(request.dbPool, scanData);

    response.json({
      message: `Coupon QR scan tracked successfully`,
      data: {
        id: result.id,
        scannedAt: result.scanned_at,
      },
    });
  } catch (error) {
    console.error(`Error tracking coupon QR scan:`, error);
    response.status(500).json({ error: `Error tracking coupon QR scan` });
  }
});

export default router;
