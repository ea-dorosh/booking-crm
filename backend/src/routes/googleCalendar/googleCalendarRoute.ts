import express from 'express';
import {
  CustomRequestType,
  CustomResponseType,
} from '@/@types/expressTypes.js';
import {
  getAuthUrl,
  getTokensByCode,
  saveEmployeeGoogleCalendarCredentials,
  getEmployeeGoogleCalendarCredentials,
  getOAuth2Client,
  checkAllGoogleCalendarIntegrations,
  createGoogleCalendarEvent,
  markTokenAsInactive,
  proactivelyRefreshTokens,
} from '@/services/googleCalendar/googleCalendarService.js';
import { RowDataPacket } from 'mysql2';
import { dayjs } from '@/services/dayjs/dayjsService.js';

const router = express.Router();

router.get(`/auth-url`, (req: CustomRequestType, res: CustomResponseType) => {
  try {
    const employeeId = req.query.employeeId;

    if (!employeeId) {
      res.status(400).json({ error: `Missing employeeId parameter` });
      return;
    }

    console.log(`Getting auth URL for employeeId: ${employeeId}`);

    // Get base auth URL
    const authUrl = getAuthUrl();
    console.log(`Generated auth URL:`, authUrl);

    let finalAuthUrl = authUrl;

    // Add device params only when explicitly using desktop client in development
    const oauthClientType = (process.env.GOOGLE_OAUTH_CLIENT_TYPE || `web`).toLowerCase();
    const isDesktopClient = oauthClientType === `desktop`;

    // For desktop client only (native apps). Do NOT append for web client.
    if (process.env.NODE_ENV !== `production` && isDesktopClient) {
      const deviceParams: Record<string, string> = {
        device_id: `booking_crm_client_${employeeId}_${Date.now()}`,
        device_name: `Booking CRM Client`,
      };

      console.log(`Adding device params (development only):`, deviceParams);
      finalAuthUrl = `${authUrl}&${new URLSearchParams(deviceParams).toString()}`;
    }

    console.log(`Final auth URL with parameters:`, finalAuthUrl);

    res.json({ url: finalAuthUrl });
  } catch (error) {
    console.error(`Error generating auth URL:`, error);
    res.status(500).json({ error: `Failed to generate authorization URL` });
  }
});

router.post(`/auth-callback`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    console.error(`Database connection not initialized`);
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const {
    code, employeeId, calendarId,
  } = req.body;
  console.log(`Received auth callback with params:`, {
    codeLength: code?.length,
    employeeId,
    calendarId,
  });

  if (!code || !employeeId || !calendarId) {
    console.error(`Missing required parameters:`, {
      code: !!code, employeeId: !!employeeId, calendarId: !!calendarId,
    });
    res.status(400).json({ error: `Missing required parameters` });
    return;
  }

  try {
    console.log(`Getting tokens by code...`);
    const tokens = await getTokensByCode(code);
    console.log(`Received tokens:`, {
      access_token: !!tokens.access_token,
      refresh_token: !!tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    if (!tokens.refresh_token) {
      console.error(`No refresh token received from Google`);
      res.status(400).json({ error: `No refresh token received. Make sure to set access_type to offline and prompt to consent.` });
      return;
    }

    console.log(`Saving employee Google Calendar credentials...`);
    await saveEmployeeGoogleCalendarCredentials(
      req.dbPool,
      Number(employeeId),
      tokens.refresh_token,
      calendarId,
    );
    console.log(`Successfully saved credentials to database`);

    res.json({ success: true });
  } catch (error) {
    console.error(`Error handling Google auth callback:`, error);
    res.status(500).json({ error: `Failed to complete Google Calendar integration` });
  }
});

router.get(`/:employeeId/google-calendar-status`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const employeeId = Number(req.params.employeeId);

  try {
    const credentials = await getEmployeeGoogleCalendarCredentials(req.dbPool, employeeId);

    if (credentials) {
      res.json({
        enabled: credentials.isActive,
        calendarId: credentials.calendarId,
        tokenExpired: !credentials.isActive,
        googleEmail: credentials.googleEmail,
        lastUsed: credentials.lastUsedAt,
        errorCount: credentials.errorCount,
        lastError: credentials.lastError,
        needsReconnection: !credentials.isActive || (credentials.errorCount && credentials.errorCount >= 3),
      });
      return;
    }

    res.json({
      enabled: false,
      calendarId: null,
      tokenExpired: false,
      needsReconnection: false,
    });
  } catch (error) {
    console.error(`Error checking Google Calendar status:`, error);
    res.status(500).json({ error: `Failed to check Google Calendar integration status` });
  }
});

router.delete(`/:employeeId/google-calendar`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const employeeId = Number(req.params.employeeId);

  try {
    // Mark as inactive instead of deleting completely
    await markTokenAsInactive(req.dbPool, employeeId, `Manually disconnected by user`);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error removing Google Calendar integration:`, error);
    res.status(500).json({ error: `Failed to remove Google Calendar integration` });
  }
});

router.post(`/proactive-refresh`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    console.log(`Manual proactive token refresh requested`);
    const result = await proactivelyRefreshTokens(req.dbPool);

    res.json({
      success: true,
      message: `Proactive token refresh completed`,
      result,
    });
  } catch (error) {
    console.error(`Error running proactive token refresh:`, error);
    res.status(500).json({ error: `Failed to refresh tokens` });
  }
});

router.get(`/integration-stats`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
        COUNT(CASE WHEN error_count >= 3 THEN 1 END) as problematic,
        AVG(error_count) as avg_error_count,
        MAX(last_used_at) as last_activity
      FROM EmployeeGoogleCalendar
    `;

    const [rows] = await req.dbPool.query<RowDataPacket[]>(query);
    const stats = rows[0];

    res.json({
      success: true,
      stats: {
        total: Number(stats.total),
        active: Number(stats.active),
        inactive: Number(stats.inactive),
        problematic: Number(stats.problematic),
        averageErrorCount: Number(stats.avg_error_count || 0).toFixed(2),
        lastActivity: stats.last_activity,
      },
    });
  } catch (error) {
    console.error(`Error getting integration stats:`, error);
    res.status(500).json({ error: `Failed to get integration statistics` });
  }
});

router.post(`/check-all-integrations`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  try {
    console.log(`Manual check of all Google Calendar integrations requested`);
    const expiredIntegrations = await checkAllGoogleCalendarIntegrations(req.dbPool);

    res.json({
      success: true,
      message: `Manual check of all Google Calendar integrations completed`,
      expiredCount: expiredIntegrations.length,
      expiredIntegrations,
    });
  } catch (error) {
    console.error(`Error running manual check of Google Calendar integrations:`, error);
    res.status(500).json({ error: `Failed to check Google Calendar integrations` });
  }
});

router.post(`/:employeeId/sync-appointments`, async (req: CustomRequestType, res: CustomResponseType) => {
  if (!req.dbPool) {
    res.status(500).json({ message: `Database connection not initialized` });
    return;
  }

  const employeeId = Number(req.params.employeeId);

  try {
    const credentials = await getEmployeeGoogleCalendarCredentials(req.dbPool, employeeId);

    if (!credentials) {
      res.status(400).json({ error: `Google Calendar integration not enabled for this employee` });
      return;
    }

    try {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: credentials.refreshToken,
      });

      await oauth2Client.getAccessToken();
    } catch (error: any) {
      if (error.message === `invalid_grant` || (error.response?.data?.error === `invalid_grant`)) {
        res.status(400).json({
          error: `Google Calendar token has expired. Please reconnect your Google Calendar.`,
          tokenExpired: true,
        });
        return;
      }

      throw error;
    }

    const appointmentsQuery = `
      SELECT
        id,
        date,
        time_start,
        time_end,
        service_name,
        customer_id,
        customer_first_name,
        customer_last_name
      FROM SavedAppointments
      WHERE
        employee_id = ?
        AND google_calendar_event_id IS NULL
        AND status = 'active'
        AND date >= CURDATE()
    `;

    interface AppointmentRow extends RowDataPacket {
      id: number;
      date: string;
      time_start: string;
      time_end: string;
      service_name: string;
      customer_id: number;
      customer_first_name: string;
      customer_last_name: string;
    }

    const [rows] = await req.dbPool.query<AppointmentRow[]>(appointmentsQuery, [employeeId]);

    console.log(`Found ${rows.length} appointments to sync for employee ID: ${employeeId}`);

    const results = {
      total: rows.length,
      synced: 0,
      failed: 0,
    };

    for (const appointment of rows) {
      try {
        const googleEventId = await createGoogleCalendarEvent(
          req.dbPool,
          {
            employeeId: employeeId,
            id: appointment.id,
            customerId: appointment.customer_id,
            customerName: `${appointment.customer_first_name} ${appointment.customer_last_name}`,
            serviceName: appointment.service_name,
            timeStart: dayjs.utc(appointment.time_start),
            timeEnd: dayjs.utc(appointment.time_end),
          },
        );

        if (googleEventId) {
          const updateQuery = `
            UPDATE SavedAppointments
            SET google_calendar_event_id = ?
            WHERE id = ?
          `;

          await req.dbPool.query(updateQuery, [googleEventId, appointment.id]);
          results.synced++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Error syncing appointment ID: ${appointment.id} to Google Calendar:`, error);
        results.failed++;
      }
    }

    res.json({
      success: true,
      message: `Sync completed`,
      results,
    });
  } catch (error) {
    console.error(`Error syncing appointments to Google Calendar:`, error);
    res.status(500).json({ error: `Failed to sync appointments to Google Calendar` });
  }
});

export default router;