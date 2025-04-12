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
} from '@/services/googleCalendar/googleCalendarService.js';

const router = express.Router();

router.get(`/auth-url`, (req: CustomRequestType, res: CustomResponseType) => {
  try {
    const employeeId = req.query.employeeId;

    if (!employeeId) {
      res.status(400).json({ error: `Missing employeeId parameter` });
      return;
    }

    console.log(`Getting auth URL for employeeId: ${employeeId}`);

    const deviceParams: Record<string, string> = {
      device_id: `dev_booking_crm_${employeeId}_${Date.now()}`,
      device_name: `Booking CRM Development`
    };

    console.log(`Adding device params:`, deviceParams);

    const authUrl = getAuthUrl();
    console.log(`Generated auth URL:`, authUrl);

    const finalAuthUrl = `${authUrl}&${new URLSearchParams(deviceParams).toString()}`;
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

  const { code, employeeId, calendarId } = req.body;
  console.log(`Received auth callback with params:`, {
    codeLength: code?.length,
    employeeId,
    calendarId
  });

  if (!code || !employeeId || !calendarId) {
    console.error(`Missing required parameters:`, { code: !!code, employeeId: !!employeeId, calendarId: !!calendarId });
    res.status(400).json({ error: `Missing required parameters` });
    return;
  }

  try {
    console.log(`Getting tokens by code...`);
    const tokens = await getTokensByCode(code);
    console.log(`Received tokens:`, {
      access_token: !!tokens.access_token,
      refresh_token: !!tokens.refresh_token,
      expiry_date: tokens.expiry_date
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
      calendarId
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
    res.json({
      enabled: !!credentials,
      calendarId: credentials?.calendarId || null,
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
    const query = `DELETE FROM EmployeeGoogleCalendar WHERE employee_id = ?`;
    await req.dbPool.query(query, [employeeId]);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error removing Google Calendar integration:`, error);
    res.status(500).json({ error: `Failed to remove Google Calendar integration` });
  }
});

export default router;