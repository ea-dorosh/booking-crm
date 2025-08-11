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

