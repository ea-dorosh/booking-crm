import { google } from 'googleapis';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { fromDayjsToMySQLDateTime } from '@/utils/timeUtils.js';
import { Date_ISO_Type } from '@/@types/utilTypes.js';

interface GoogleCalendarCredentials {
  employeeId: number;
  refreshToken: string;
  calendarId: string;
  isActive?: boolean;
  lastUsedAt?: Date;
  errorCount?: number;
  lastError?: string;
  googleEmail?: string;
  expiresAt?: Date;
}

interface GoogleCalendarCredentialsRow extends RowDataPacket {
  employee_id: number;
  refresh_token: string;
  calendar_id: string;
  is_active: boolean;
  last_used_at: string | null;
  error_count: number;
  last_error: string | null;
  google_email: string | null;
  expires_at: string | null;
}

interface GoogleEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  console.log(`Creating OAuth2 client with:`, {
    clientId: clientId ? `${clientId.substring(0, 10)}...` : null,
    hasSecret: !!clientSecret,
    redirectUri
  });

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(`Google OAuth credentials not configured`);
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
};

export const getAuthUrl = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  console.log(`Google OAuth configuration:`, {
    clientId: clientId ? `${clientId.substring(0, 15)}...` : `missing`,
    clientSecret: clientSecret ? `set` : `missing`,
    redirectUri,
    isDesktopApp: clientId?.includes(`m3i6sqp1clt5`)
  });

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(`Google OAuth credentials not configured`);
  }

  const oauth2Client = getOAuth2Client();

  const scopes = [
    `https://www.googleapis.com/auth/calendar`,
    `https://www.googleapis.com/auth/calendar.events`,
    `https://www.googleapis.com/auth/calendar.readonly`,
    `https://www.googleapis.com/auth/userinfo.profile`,
    `https://www.googleapis.com/auth/userinfo.email`
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: `offline`,
    scope: scopes,
    prompt: `consent`,
    include_granted_scopes: true
  });

  console.log(`Generated auth URL:`, authUrl);

  return authUrl;
};

export const getTokensByCode = async (code: string) => {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const saveEmployeeGoogleCalendarCredentials = async (
  dbPool: Pool,
  employeeId: number,
  refreshToken: string,
  calendarId: string,
  googleEmail?: string
): Promise<void> => {
  console.log(`Saving Google Calendar credentials:`, {
    employeeId,
    refreshTokenLength: refreshToken.length,
    calendarId,
    googleEmail
  });

  try {
    // Get user info if we have the proper tokens
    let userEmail = googleEmail;
    if (!userEmail && refreshToken) {
      try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        userEmail = userInfo.data.email || undefined;
        console.log(`Retrieved user email from Google:`, userEmail);
      } catch (error) {
        console.log(`Could not retrieve user email:`, error);
      }
    }

    const query = `
      INSERT INTO EmployeeGoogleCalendar (
        employee_id,
        refresh_token,
        calendar_id,
        google_email,
        is_active,
        error_count,
        last_used_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, true, 0, NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        refresh_token = VALUES(refresh_token),
        calendar_id = VALUES(calendar_id),
        google_email = VALUES(google_email),
        is_active = true,
        error_count = 0,
        last_error = NULL,
        last_used_at = NOW(),
        updated_at = NOW()
    `;

    console.log(`Executing SQL query with params:`, {
      employeeId,
      refreshTokenTruncated: refreshToken.substring(0, 10) + `...`,
      calendarId,
      googleEmail: userEmail
    });

    const result = await dbPool.query(query, [
      employeeId,
      refreshToken,
      calendarId,
      userEmail
    ]);

    console.log(`Query executed successfully:`, result);
  } catch (error) {
    console.error(`Error saving Google Calendar credentials:`, error);
    throw error;
  }
};

export const getEmployeeGoogleCalendarCredentials = async (
  dbPool: Pool,
  employeeId: number
): Promise<GoogleCalendarCredentials | null> => {
  const query = `
    SELECT
      employee_id,
      refresh_token,
      calendar_id,
      is_active,
      last_used_at,
      error_count,
      last_error,
      google_email,
      expires_at
    FROM EmployeeGoogleCalendar
    WHERE employee_id = ? AND is_active = true
  `;

  const [rows] = await dbPool.query<GoogleCalendarCredentialsRow[]>(query, [employeeId]);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    employeeId: row.employee_id,
    refreshToken: row.refresh_token,
    calendarId: row.calendar_id,
    isActive: row.is_active,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
    errorCount: row.error_count,
    lastError: row.last_error || undefined,
    googleEmail: row.google_email || undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
  };
};

export const updateTokenStatus = async (
  dbPool: Pool,
  employeeId: number,
  isSuccess: boolean,
  error?: string
): Promise<void> => {
  try {
    if (isSuccess) {
      const query = `
        UPDATE EmployeeGoogleCalendar
        SET
          last_used_at = NOW(),
          error_count = 0,
          last_error = NULL,
          updated_at = NOW()
        WHERE employee_id = ?
      `;
      await dbPool.query(query, [employeeId]);
    } else {
      const query = `
        UPDATE EmployeeGoogleCalendar
        SET
          error_count = error_count + 1,
          last_error = ?,
          is_active = CASE
            WHEN error_count >= 5 THEN false
            ELSE is_active
          END,
          updated_at = NOW()
        WHERE employee_id = ?
      `;
      await dbPool.query(query, [error, employeeId]);
    }
  } catch (updateError) {
    console.error(`Error updating token status:`, updateError);
  }
};

export const markTokenAsInactive = async (
  dbPool: Pool,
  employeeId: number,
  reason: string
): Promise<void> => {
  try {
    const query = `
      UPDATE EmployeeGoogleCalendar
      SET
        is_active = false,
        last_error = ?,
        updated_at = NOW()
      WHERE employee_id = ?
    `;
    await dbPool.query(query, [reason, employeeId]);
    console.log(`Marked token as inactive for employee ${employeeId}: ${reason}`);
  } catch (error) {
    console.error(`Error marking token as inactive:`, error);
  }
};

export const getEmployeeCalendarClient = async (
  dbPool: Pool,
  employeeId: number,
  retryCount: number = 0
): Promise<{
  calendarClient: any;
  calendarId: string;
  credentials?: GoogleCalendarCredentials;
} | null> => {
  try {
    const credentials = await getEmployeeGoogleCalendarCredentials(dbPool, employeeId);

    if (!credentials) {
      console.log(`No active Google Calendar credentials found for employee ID: ${employeeId}`);
      return null;
    }

    console.log(`Retrieved credentials for employee ID: ${employeeId}, calendarId: ${credentials.calendarId}, errorCount: ${credentials.errorCount}`);

    // If too many errors, don't retry
    if (credentials.errorCount && credentials.errorCount >= 5) {
      console.log(`Too many errors for employee ${employeeId}, marking as inactive`);
      await markTokenAsInactive(dbPool, employeeId, 'Too many consecutive errors');
      return null;
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken
    });

    try {
      const tokens = await oauth2Client.getAccessToken();
      console.log(`Access token refreshed successfully for employee ${employeeId}:`, !!tokens.token);

      // Update success status
      await updateTokenStatus(dbPool, employeeId, true);

      return {
        calendarClient: google.calendar({ version: `v3`, auth: oauth2Client }),
        calendarId: credentials.calendarId,
        credentials
      };
    } catch (authError: any) {
      console.error(`Error refreshing access token for employee ${employeeId}:`, authError.message);

      const errorMessage = authError.message || 'Unknown error';
      const isInvalidGrant = errorMessage === `invalid_grant` ||
                           (authError.response?.data?.error === `invalid_grant`);

      if (isInvalidGrant) {
        console.log(`Invalid grant error for employee ${employeeId} - token likely revoked`);
        await markTokenAsInactive(dbPool, employeeId, 'Token revoked or expired (invalid_grant)');
        return null;
      }

      // For other errors, update error count but don't remove token immediately
      await updateTokenStatus(dbPool, employeeId, false, errorMessage);

      // Retry once for transient errors
      if (retryCount === 0 && (
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('503') ||
        errorMessage.includes('502')
      )) {
        console.log(`Retrying token refresh for employee ${employeeId} due to transient error`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return getEmployeeCalendarClient(dbPool, employeeId, retryCount + 1);
      }

      throw authError;
    }
  } catch (error: any) {
    console.error(`Error getting Google Calendar client for employee ID: ${employeeId}`, error);

    // Update error status
    if (error.message !== 'invalid_grant') {
      await updateTokenStatus(dbPool, employeeId, false, error.message);
    }

    return null;
  }
};

export const checkGoogleCalendarAvailability = async (
  dbPool: Pool,
  employeeId: number,
  startTime: string, // in UTC
  endTime: string // in UTC
): Promise<boolean> => {
  const calendarData = await getEmployeeCalendarClient(dbPool, employeeId);

  if (!calendarData) {
    return true;
  }

  const { calendarClient, calendarId } = calendarData;

  const isoStartTime = dayjs.utc(startTime).toISOString();
  const isoEndTime = dayjs.utc(endTime).toISOString();

  const startOfDay = dayjs.utc(startTime).startOf(`day`).toISOString();
  const endOfDay = dayjs.utc(startTime).endOf(`day`).toISOString();

  console.log(`Checking Google Calendar availability for:`, {
    calendarId,
    requestedSlot: { startTime: isoStartTime, endTime: isoEndTime },
    expandedSearch: { dayStart: startOfDay, dayEnd: endOfDay }
  });

  try {
    const response = await calendarClient.events.list({
      calendarId,
      timeMin: startOfDay,
      timeMax: endOfDay,
      singleEvents: true,
    });

    const requestStart = dayjs.utc(startTime);
    const requestEnd = dayjs.utc(endTime);

    let hasConflict = false;

    if (response.data.items && response.data.items.length > 0) {
      console.log(`Found ${response.data.items.length} events for this day`);

      for (const event of response.data.items as GoogleCalendarEvent[]) {
        if (!event.start?.dateTime || !event.end?.dateTime) continue;

        const eventStart = dayjs(event.start.dateTime);
        const eventEnd = dayjs(event.end.dateTime);

        console.log(`Checking event:`, {
          summary: event.summary,
          start: eventStart.toISOString(),
          end: eventEnd.toISOString()
        });

        const overlaps = (requestStart.isBefore(eventEnd) && requestEnd.isAfter(eventStart));

        if (overlaps) {
          console.log(`Conflict detected with event:`, event.summary);
          hasConflict = true;
          break;
        }
      }
    } else {
      console.log(`No events found for this day`);
    }

    return !hasConflict;
  } catch (error: any) {
    console.error(`Error checking Google Calendar availability:`, error);

    if (error.response) {
      console.error(`Error details:`, {
        status: error.response.status,
        data: error.response.data,
        requestUrl: error.config.url,
        params: error.config.params
      });
    }

    return true;
  }
};

export const createGoogleCalendarEvent = async (
  dbPool: Pool,
  employeeId: number,
  appointment: {
    id: number;
    customerId: number;
    customerName: string;
    serviceName: string;
    timeStart: dayjs.Dayjs;
    timeEnd: dayjs.Dayjs;
  }
): Promise<string | null> => {
  const calendarData = await getEmployeeCalendarClient(dbPool, employeeId);

  if (!calendarData) {
    console.log(`No Google Calendar integration found for employee ID:`, employeeId);
    return null;
  }

  const { calendarClient, calendarId } = calendarData;

  console.log(`Creating Google Calendar event:`, {
    calendarId,
    summary: `${appointment.serviceName} - ${appointment.customerName}`,
    appointmentId: appointment.id,
    startTime: appointment.timeStart.toISOString(), // in UTC
    endTime: appointment.timeEnd.toISOString(), // in UTC
  });

  const event: GoogleEvent = {
    summary: `${appointment.serviceName} - ${appointment.customerName}`,
    description: `Appointment #${appointment.id} with ${appointment.customerName} #${appointment.customerId}`,
    start: {
      dateTime: appointment.timeStart.toISOString(), //2025-07-10T10:00:00.000Z
      timeZone: `UTC`,
    },
    end: {
      dateTime: appointment.timeEnd.toISOString(), //2025-07-10T12:00:00.000Z
      timeZone: `UTC`,
    },
  };

  try {
    const response = await calendarClient.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log(`Event created successfully:`, response.data.id);
    return response.data.id || null;
  } catch (error: any) {
    console.error(`Error creating Google Calendar event:`, error);

    if (error.response) {
      console.error(`Error details:`, {
        status: error.response.status,
        data: error.response.data
      });
    }

    return null;
  }
};

export const updateGoogleCalendarEvent = async (
  dbPool: Pool,
  employeeId: number,
  eventId: string,
  appointment: {
    id: number;
    customerId: number;
    customerName: string;
    serviceName: string;
    date: string;
    timeStart: string;
    timeEnd: string;
  }
): Promise<boolean> => {
  const calendarData = await getEmployeeCalendarClient(dbPool, employeeId);

  if (!calendarData) {
    return false;
  }

  const { calendarClient, calendarId } = calendarData;

  const startDateTime = dayjs.tz(appointment.timeStart, 'Europe/Berlin').toISOString();
  const endDateTime = dayjs.tz(appointment.timeEnd, 'Europe/Berlin').toISOString();

  console.log(`Updating Google Calendar event:`, {
    calendarId,
    eventId,
    summary: `${appointment.serviceName} - ${appointment.customerName}`,
    startTime: startDateTime,
    endTime: endDateTime
  });

  const event: GoogleEvent = {
    summary: `${appointment.serviceName} - ${appointment.customerName}`,
    description: `Appointment #${appointment.id} with Customer #${appointment.customerId}`,
    start: {
      dateTime: startDateTime,
      timeZone: `Europe/Berlin`,
    },
    end: {
      dateTime: endDateTime,
      timeZone: `Europe/Berlin`,
    },
  };

  try {
    const response = await calendarClient.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });

    console.log(`Event updated successfully:`, response.data.id);
    return true;
  } catch (error: any) {
    console.error(`Error updating Google Calendar event:`, error);

    if (error.response) {
      console.error(`Error details:`, {
        status: error.response.status,
        data: error.response.data
      });
    }

    return false;
  }
};

export const deleteGoogleCalendarEvent = async (
  dbPool: Pool,
  employeeId: number,
  eventId: string
): Promise<boolean> => {
  const calendarData = await getEmployeeCalendarClient(dbPool, employeeId);

  if (!calendarData) {
    console.log(`No Google Calendar integration found for employee ID:`, employeeId);
    return false;
  }

  const { calendarClient, calendarId } = calendarData;

  console.log(`Deleting Google Calendar event:`, {
    calendarId,
    eventId
  });

  try {
    await calendarClient.events.delete({
      calendarId,
      eventId,
    });

    console.log(`Event deleted successfully`);
    return true;
  } catch (error: any) {
    console.error(`Error deleting Google Calendar event:`, error);

    if (error.response) {
      console.error(`Error details:`, {
        status: error.response.status,
        data: error.response.data
      });
    }

    return false;
  }
};

export const getGoogleCalendarEvents = async (
  dbPool: Pool,
  employeeId: number,
  startDate: string,
  endDate: string
): Promise<{ start: Date; end: Date; summary: string }[] | null> => {
  try {
    const calendarData = await getEmployeeCalendarClient(dbPool, employeeId);

    if (!calendarData) {
      console.log(`No Google Calendar integration found for employee ID: ${employeeId}`);
      return null;
    }

    const { calendarClient, calendarId } = calendarData;

    const tzStartDate = dayjs.tz(startDate, 'Europe/Berlin').startOf('day');
    const tzEndDate = dayjs.tz(endDate, 'Europe/Berlin').endOf('day');

    console.log(`Fetching Google Calendar events for employee ${employeeId} on ${startDate} - ${endDate}:`, {
      calendarId,
      timeMin: tzStartDate.toISOString(),
      timeMax: tzEndDate.toISOString(),
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    const response = await calendarClient.events.list({
      calendarId,
      timeMin: tzStartDate.toISOString(),
      timeMax: tzEndDate.toISOString(),
      singleEvents: true,
      orderBy: `startTime`,
      timeZone: 'Europe/Berlin'
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log(`No events found for employee ${employeeId} in the specified period`);
      return [];
    }

    const events = (response.data.items as GoogleCalendarEvent[])
      .filter((event: GoogleCalendarEvent) => event.start?.dateTime && event.end?.dateTime)
      .map((event: GoogleCalendarEvent) => {
        const startDateTime = event.start!.dateTime as string;
        const endDateTime = event.end!.dateTime as string;

        console.log(`Processing Google Calendar event:`, {
          summary: event.summary,
          originalStart: startDateTime,
          originalEnd: endDateTime,
          parsedStart: dayjs(startDateTime).tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss'),
          parsedEnd: dayjs(endDateTime).tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')
        });

        return {
          start: dayjs(startDateTime).tz('Europe/Berlin').toDate(),
          end: dayjs(endDateTime).tz('Europe/Berlin').toDate(),
          summary: event.summary || `Busy`
        };
      });

    console.log(`Found ${events.length} events in Google Calendar for employee ${employeeId}`);
    return events;
  } catch (error: any) {
    console.error(`Error fetching Google Calendar events for employee ${employeeId}:`, error.message);
    return null;
  }
};

export const getGoogleCalendarEventsForSpecificDates = async (
  dbPool: Pool,
  employeeId: number,
  dates: Date_ISO_Type[],
): Promise<{ start: string; end: string; summary: string }[] | null> => {
  try {
    const calendarData = await getEmployeeCalendarClient(dbPool, employeeId);

    if (!calendarData) {
      console.log(`No Google Calendar integration found for employee ID: ${employeeId}`);
      return null;
    }

    const { calendarClient, calendarId } = calendarData;

    // Если дат нет, возвращаем пустой массив
    if (dates.length === 0) {
      return [];
    }

    // Сортируем даты для определения минимального и максимального диапазона
    const sortedDates = dates.sort();
    const minDate = sortedDates[0];
    const maxDate = sortedDates[sortedDates.length - 1];

    const startDateUtc = dayjs.utc(minDate).startOf('day');
    const endDateUtc = dayjs.utc(maxDate).endOf('day');

    console.log(`Fetching Google Calendar events for employee ${employeeId} for specific dates:`, {
      calendarId,
      requestedDates: dates,
      timeMin: startDateUtc.toISOString(),
      timeMax: endDateUtc.toISOString(),
    });

    const response = await calendarClient.events.list({
      calendarId,
      timeMin: startDateUtc.toISOString(),
      timeMax: endDateUtc.toISOString(),
      singleEvents: true,
      orderBy: `startTime`,
      timeZone: `UTC`,
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log(`No events found for employee ${employeeId} in the specified period`);
      return [];
    }

    // Фильтруем события только для запрошенных дат
    const events = (response.data.items as GoogleCalendarEvent[])
      .filter((event: GoogleCalendarEvent) => {
        if (!event.start?.dateTime || !event.end?.dateTime) return false;

        const eventDate = dayjs.utc(event.start.dateTime).format(`YYYY-MM-DD`);
        return dates.includes(eventDate as Date_ISO_Type  );
      })
      .map((event: GoogleCalendarEvent) => {
        const startDateTime = event.start!.dateTime as string;
        const endDateTime = event.end!.dateTime as string;

        console.log(`Processing Google Calendar event for requested date:`, {
          summary: event.summary,
          originalStart: startDateTime,
          originalEnd: endDateTime,
          eventDate: dayjs.utc(startDateTime).format('YYYY-MM-DD'),
        });

        return {
          start: startDateTime,
          end: endDateTime,
          summary: event.summary || `Busy`
        };
      });

    console.log(`Found ${events.length} events in Google Calendar for employee ${employeeId} on requested dates: ${dates.join(', ')}`);
    return events;
  } catch (error: any) {
    console.error(`Error fetching Google Calendar events for employee ${employeeId}:`, error.message);
    return null;
  }
};

export const removeEmployeeGoogleCalendarCredentials = async (
  dbPool: Pool,
  employeeId: number
): Promise<boolean> => {
  try {
    const query = `
      DELETE FROM EmployeeGoogleCalendar
      WHERE employee_id = ?
    `;

    await dbPool.query(query, [employeeId]);
    return true;
  } catch (error: any) {
    console.error(`Error removing Google Calendar credentials: ${error.message}`);
    return false;
  }
};

export const proactivelyRefreshTokens = async (
  dbPool: Pool
): Promise<{ refreshed: number; failed: number; inactive: number }> => {
  try {
    console.log(`Starting proactive token refresh...`);

    const query = `
      SELECT employee_id, calendar_id, error_count, last_used_at, google_email
      FROM EmployeeGoogleCalendar
      WHERE is_active = true
    `;

    const [rows] = await dbPool.query<GoogleCalendarCredentialsRow[]>(query);

    console.log(`Found ${rows.length} active Google Calendar integrations to refresh`);

    let refreshed = 0;
    let failed = 0;
    let inactive = 0;

    for (const row of rows) {
      const employeeId = row.employee_id;

      try {
        const calendarClient = await getEmployeeCalendarClient(dbPool, employeeId);

        if (calendarClient) {
          console.log(`Successfully refreshed token for employee ID: ${employeeId}`);
          refreshed++;
        } else {
          console.log(`Token marked as inactive for employee ID: ${employeeId}`);
          inactive++;
        }
      } catch (error: any) {
        console.error(`Failed to refresh token for employee ID: ${employeeId}:`, error.message);
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Proactive refresh completed: ${refreshed} refreshed, ${failed} failed, ${inactive} marked inactive`);

    return { refreshed, failed, inactive };
  } catch (error: any) {
    console.error(`Error in proactive token refresh:`, error);
    return { refreshed: 0, failed: 0, inactive: 0 };
  }
};

export const checkAllGoogleCalendarIntegrations = async (
  dbPool: Pool
): Promise<{ employeeId: number; calendarId: string }[]> => {
  try {
    const query = `
      SELECT employee_id, calendar_id, google_email
      FROM EmployeeGoogleCalendar
      WHERE is_active = false OR error_count >= 3
    `;

    const [rows] = await dbPool.query<GoogleCalendarCredentialsRow[]>(query);

    console.log(`Found ${rows.length} Google Calendar integrations that need attention`);

    const problematicIntegrations: { employeeId: number; calendarId: string }[] = [];

    for (const row of rows) {
      problematicIntegrations.push({
        employeeId: row.employee_id,
        calendarId: row.calendar_id
      });
    }

    return problematicIntegrations;
  } catch (error: any) {
    console.error(`Error checking Google Calendar integrations:`, error);
    return [];
  }
};