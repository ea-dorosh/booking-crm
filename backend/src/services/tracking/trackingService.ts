import { Pool } from 'mysql2/promise';

export interface QrScanData {
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  deviceInfo?: {
    screenWidth?: number;
    screenHeight?: number;
    language?: string;
    timezone?: string;
    isMobile?: boolean;
    platform?: string;
    source?: string;
    trackedAt?: string;
  };
}

export interface QrScanRecord {
  id: number;
  scanned_at: Date;
  user_agent: string | null;
  ip_address: string | null;
  referrer: string | null;
  device_info: any | null;
  created_at: Date;
  updated_at: Date;
}

export interface QrScanStats {
  totalScans: number;
  uniqueScans: number;
  scansByDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface LinkClickData {
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  channel: string; // e.g., instagram-bio, instagram-stories
  target: string; // e.g., /booking
  clickedAt?: string; // ISO date string
}

export interface LinkClickRecord {
  id: number;
  clicked_at: Date;
  user_agent: string | null;
  ip_address: string | null;
  referrer: string | null;
  channel: string;
  target: string;
  created_at: Date;
  updated_at: Date;
}

export interface LinkClickStats {
  totalClicks: number;
  uniqueClicks: number;
  clicksByDay: Array<{
    date: string;
    count: number;
  }>;
}

export async function saveLinkClick(
  dbPool: Pool,
  clickData: LinkClickData,
): Promise<LinkClickRecord> {
  const [result] = await dbPool.execute(
    `INSERT INTO TrackingLinkClicks (
      clicked_at,
      user_agent,
      ip_address,
      referrer,
      channel,
      target
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      clickData.clickedAt ? new Date(clickData.clickedAt) : new Date(),
      clickData.userAgent || null,
      clickData.ipAddress || null,
      clickData.referrer || null,
      clickData.channel,
      clickData.target,
    ],
  );

  const insertId = (result as any).insertId;

  const [rows] = await dbPool.execute(
    `SELECT * FROM TrackingLinkClicks WHERE id = ?`,
    [insertId],
  );

  return (rows as LinkClickRecord[])[0];
}

export async function getLinkClickStats(
  dbPool: Pool,
  days: number = 90,
  channel?: string,
): Promise<LinkClickStats> {
  const channelWhere = channel ? ` WHERE channel = ?` : ``;
  const channelParam = channel ? [channel] : [];

  const [totalResult] = await dbPool.execute(
    `SELECT COUNT(*) as total FROM TrackingLinkClicks${channelWhere}`,
    channelParam,
  );
  const totalClicks = (totalResult as any)[0].total;

  const [uniqueResult] = await dbPool.execute(
    `SELECT COUNT(DISTINCT ip_address) as unique_count
     FROM TrackingLinkClicks${channelWhere ? `${channelWhere} AND ip_address IS NOT NULL` : ` WHERE ip_address IS NOT NULL`}`,
    channelParam,
  );
  const uniqueClicks = (uniqueResult as any)[0].unique_count;

  const [dailyResult] = await dbPool.execute(
    `SELECT
       DATE(clicked_at) as date,
       COUNT(*) as count
     FROM TrackingLinkClicks
     ${channel ? `WHERE channel = ? AND clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)` : `WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`}
     GROUP BY DATE(clicked_at)
     ORDER BY date ASC`,
    channel ? [channel, days] : [days],
  );

  const clicksByDay = (dailyResult as any[]).map(row => ({
    date: row.date,
    count: row.count,
  }));

  return {
    totalClicks,
    uniqueClicks,
    clicksByDay,
  };
}

export async function saveQrScan(
  dbPool: Pool,
  scanData: QrScanData,
): Promise<QrScanRecord> {
  const [result] = await dbPool.execute(
    `INSERT INTO TrackingQrScans (
      scanned_at,
      user_agent,
      ip_address,
      referrer,
      device_info
    ) VALUES (NOW(), ?, ?, ?, ?)`,
    [
      scanData.userAgent || null,
      scanData.ipAddress || null,
      scanData.referrer || null,
      scanData.deviceInfo ? JSON.stringify(scanData.deviceInfo) : null,
    ],
  );

  const insertId = (result as any).insertId;

  const [rows] = await dbPool.execute(
    `SELECT * FROM TrackingQrScans WHERE id = ?`,
    [insertId],
  );

  return (rows as QrScanRecord[])[0];
}

export async function getQrScanStats(
  dbPool: Pool,
  days: number = 90,
): Promise<QrScanStats> {
  const [totalResult] = await dbPool.execute(
    `SELECT COUNT(*) as total FROM TrackingQrScans`,
  );
  const totalScans = (totalResult as any)[0].total;

  const [uniqueResult] = await dbPool.execute(
    `SELECT COUNT(DISTINCT ip_address) as unique_count
     FROM TrackingQrScans
     WHERE ip_address IS NOT NULL`,
  );
  const uniqueScans = (uniqueResult as any)[0].unique_count;

  const [dailyResult] = await dbPool.execute(
    `SELECT
       DATE(scanned_at) as date,
       COUNT(*) as count
     FROM TrackingQrScans
     WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(scanned_at)
     ORDER BY date ASC`,
    [days],
  );

  const scansByDay = (dailyResult as any[]).map(row => ({
    date: row.date,
    count: row.count,
  }));

  return {
    totalScans,
    uniqueScans,
    scansByDay,
  };
}

