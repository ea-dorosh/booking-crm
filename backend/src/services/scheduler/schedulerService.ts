import cron from 'node-cron';
import { Pool } from 'mysql2/promise';
import { checkAllGoogleCalendarIntegrations } from '../googleCalendar/googleCalendarService.js';

export const initScheduler = (dbPool: Pool): void => {
  console.log(`Initializing scheduler tasks...`);

  scheduleGoogleCalendarTokenRefresh(dbPool);
}

export const scheduleGoogleCalendarTokenRefresh = (dbPool: Pool): void => {
  cron.schedule(`0 0 3 * * *`, async () => {
    console.log(`Running scheduled task: Refreshing Google Calendar tokens...`);

    try {
      const expiredIntegrations = await checkAllGoogleCalendarIntegrations(dbPool);

      if (expiredIntegrations.length > 0) {
        console.log(`Found ${expiredIntegrations.length} expired Google Calendar integrations:`);
        expiredIntegrations.forEach(integration => {
          console.log(`- Employee ID: ${integration.employeeId}, Calendar ID: ${integration.calendarId}`);
        });
      } else {
        console.log(`All Google Calendar integrations are valid`);
      }
    } catch (error) {
      console.error(`Error running Google Calendar tokens refresh task:`, error);
    }
  }, {
    scheduled: true,
    timezone: `Europe/Berlin`
  });

  console.log(`Google Calendar token refresh task scheduled to run daily at 03:00`);
}