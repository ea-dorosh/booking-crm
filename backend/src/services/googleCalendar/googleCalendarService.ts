import { google } from 'googleapis';
import { Pool, RowDataPacket } from 'mysql2/promise';

interface GoogleCalendarCredentials {
  employeeId: number;
  refreshToken: string;
  calendarId: string;
}

interface GoogleCalendarCredentialsRow extends RowDataPacket {
  employee_id: number;
  refresh_token: string;
  calendar_id: string;
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
    `https://www.googleapis.com/auth/calendar.events`
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
  calendarId: string
): Promise<void> => {
  console.log(`Saving Google Calendar credentials:`, {
    employeeId,
    refreshTokenLength: refreshToken.length,
    calendarId
  });

  try {
    const query = `
      INSERT INTO EmployeeGoogleCalendar (employee_id, refresh_token, calendar_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE refresh_token = ?, calendar_id = ?
    `;

    console.log(`Executing SQL query with params:`, {
      employeeId,
      refreshTokenTruncated: refreshToken.substring(0, 10) + `...`,
      calendarId
    });

    const result = await dbPool.query(query, [
      employeeId,
      refreshToken,
      calendarId,
      refreshToken,
      calendarId
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
    SELECT employee_id, refresh_token, calendar_id
    FROM EmployeeGoogleCalendar
    WHERE employee_id = ?
  `;

  const [rows] = await dbPool.query<GoogleCalendarCredentialsRow[]>(query, [employeeId]);

  if (rows.length === 0) {
    return null;
  }

  return {
    employeeId: rows[0].employee_id,
    refreshToken: rows[0].refresh_token,
    calendarId: rows[0].calendar_id
  };
};

export const getEmployeeCalendarClient = async (
  dbPool: Pool,
  employeeId: number
) => {
  try {
    const credentials = await getEmployeeGoogleCalendarCredentials(dbPool, employeeId);

    if (!credentials) {
      console.log(`No Google Calendar credentials found for employee ID: ${employeeId}`);
      return null;
    }

    console.log(`Retrieved credentials for employee ID: ${employeeId}, calendarId: ${credentials.calendarId}`);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken
    });

    try {
      const tokens = await oauth2Client.getAccessToken();
      console.log(`Access token refreshed successfully:`, !!tokens.token);
    } catch (authError: any) {
      console.error(`Error refreshing access token:`, authError.message);

      if (authError.message === `invalid_grant` ||
          (authError.response?.data?.error === `invalid_grant`)) {

        await removeEmployeeGoogleCalendarCredentials(dbPool, employeeId);

        console.log(`Removed expired Google Calendar credentials for employee ID: ${employeeId}`);
        return null;
      }
    }

    return {
      calendarClient: google.calendar({ version: `v3`, auth: oauth2Client }),
      calendarId: credentials.calendarId
    };
  } catch (error: any) {
    console.error(`Error getting Google Calendar client for employee ID: ${employeeId}`, error);
    return null;
  }
};

export const checkGoogleCalendarAvailability = async (
  dbPool: Pool,
  employeeId: number,
  startTime: string,
  endTime: string
): Promise<boolean> => {
  const calendarData = await getEmployeeCalendarClient(dbPool, employeeId);

  if (!calendarData) {
    return true;
  }

  const { calendarClient, calendarId } = calendarData;

  const isoStartTime = new Date(startTime).toISOString();
  const isoEndTime = new Date(endTime).toISOString();

  const startOfDay = new Date(startTime);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startTime);
  endOfDay.setHours(23, 59, 59, 999);

  const isoDayStart = startOfDay.toISOString();
  const isoDayEnd = endOfDay.toISOString();

  console.log(`Checking Google Calendar availability for:`, {
    calendarId,
    requestedSlot: { startTime: isoStartTime, endTime: isoEndTime },
    expandedSearch: { dayStart: isoDayStart, dayEnd: isoDayEnd }
  });

  try {
    const response = await calendarClient.events.list({
      calendarId,
      timeMin: isoDayStart,
      timeMax: isoDayEnd,
      singleEvents: true,
    });

    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);

    let hasConflict = false;

    if (response.data.items && response.data.items.length > 0) {
      console.log(`Found ${response.data.items.length} events for this day`);

      for (const event of response.data.items) {
        if (!event.start?.dateTime || !event.end?.dateTime) continue;

        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        console.log(`Checking event:`, {
          summary: event.summary,
          start: eventStart.toISOString(),
          end: eventEnd.toISOString()
        });

        const overlaps = (requestStart < eventEnd && requestEnd > eventStart);

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
    date: string;
    timeStart: string;
    timeEnd: string;
  }
): Promise<string | null> => {
  const calendarData = await getEmployeeCalendarClient(dbPool, employeeId);

  if (!calendarData) {
    console.log(`No Google Calendar integration found for employee ID:`, employeeId);
    return null;
  }

  const { calendarClient, calendarId } = calendarData;

  const startDateTime = new Date(appointment.timeStart).toISOString();
  const endDateTime = new Date(appointment.timeEnd).toISOString();

  console.log(`Creating Google Calendar event:`, {
    calendarId,
    summary: `${appointment.serviceName} - ${appointment.customerName}`,
    appointmentId: appointment.id,
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

  const startDateTime = new Date(appointment.timeStart).toISOString();
  const endDateTime = new Date(appointment.timeEnd).toISOString();

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

    console.log(`Fetching Google Calendar events for employee ${employeeId}:`, {
      calendarId,
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString()
    });

    const response = await calendarClient.events.list({
      calendarId,
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: `startTime`
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log(`No events found for employee ${employeeId} in the specified period`);
      return [];
    }

    const events = response.data.items
      .filter(event => event.start?.dateTime && event.end?.dateTime)
      .map(event => ({
        start: new Date(event.start!.dateTime as string),
        end: new Date(event.end!.dateTime as string),
        summary: event.summary || `Busy`
      }));

    console.log(`Found ${events.length} events in Google Calendar for employee ${employeeId}`);
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

export const checkAllGoogleCalendarIntegrations = async (
  dbPool: Pool
): Promise<{ employeeId: number; calendarId: string }[]> => {
  try {
    const query = `
      SELECT employee_id, calendar_id
      FROM EmployeeGoogleCalendar
    `;

    const [rows] = await dbPool.query<GoogleCalendarCredentialsRow[]>(query);

    console.log(`Found ${rows.length} Google Calendar integrations to check`);

    const expiredIntegrations: { employeeId: number; calendarId: string }[] = [];

    for (const row of rows) {
      const employeeId = row.employee_id;
      const calendarId = row.calendar_id;

      try {
        const credentials = await getEmployeeGoogleCalendarCredentials(dbPool, employeeId);

        if (!credentials) {
          console.log(`No credentials found for employee ID: ${employeeId}`);
          continue;
        }

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
          refresh_token: credentials.refreshToken
        });

        await oauth2Client.getAccessToken();
        console.log(`Successfully refreshed token for employee ID: ${employeeId}`);
      } catch (error: any) {
        if (error.message === 'invalid_grant' ||
            (error.response?.data?.error === 'invalid_grant')) {
          console.log(`Token expired for employee ID: ${employeeId}, calendar ID: ${calendarId}`);
          expiredIntegrations.push({ employeeId, calendarId });
        } else {
          console.error(`Error checking calendar integration for employee ID: ${employeeId}:`, error);
        }
      }
    }

    return expiredIntegrations;
  } catch (error: any) {
    console.error(`Error checking Google Calendar integrations:`, error);
    return [];
  }
};