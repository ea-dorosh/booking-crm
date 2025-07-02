import cron from 'node-cron';
import { Pool, RowDataPacket, createPool } from 'mysql2/promise';
import { checkAllGoogleCalendarIntegrations, proactivelyRefreshTokens } from '../googleCalendar/googleCalendarService.js';
import { sendGoogleCalendarReconnectEmail } from '@/mailer/mailer.js';
import dotenv from 'dotenv';

dotenv.config();

interface EmployeeRow extends RowDataPacket {
  employee_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  database_name: string;
}

export const initScheduler = (dbPool: Pool): void => {
  console.log(`Initializing scheduler tasks...`);

  // Proactively refresh tokens every 4 hours
  scheduleProactiveTokenRefresh(dbPool);

  // Check for problematic integrations daily
  scheduleGoogleCalendarTokenRefresh(dbPool);
}

async function getAdminEmailForDatabase(databaseName: string): Promise<string | null> {
  try {
    const usersDbPool = createPool({
      host: process.env.DB_HOST as string,
      user: process.env.DB_USER as string,
      password: process.env.DB_PASSWORD as string,
      database: 'users_database',
    });

    const [rows] = await usersDbPool.query<UserRow[]>(
      `SELECT id, email FROM Users WHERE database_name = ?`,
      [databaseName]
    );

    await usersDbPool.end();

    if (rows.length > 0) {
      return rows[0].email;
    }

    return null;
  } catch (error) {
    console.error(`Error getting admin email for database:`, error);
    return null;
  }
}

export const scheduleProactiveTokenRefresh = (dbPool: Pool): void => {
  // Run every 4 hours to proactively refresh tokens
  cron.schedule(`0 0 */4 * * *`, async () => {
    console.log(`Running proactive Google Calendar token refresh...`);

    try {
      const [databaseRows] = await dbPool.query<RowDataPacket[]>(`SELECT DATABASE() as dbName`);
      const databaseName = databaseRows[0]?.dbName as string;

      console.log(`Refreshing tokens for database: ${databaseName}`);

      const result = await proactivelyRefreshTokens(dbPool);

      console.log(`Proactive refresh completed for ${databaseName}:`, result);

      // If there are many failures, log a warning
      if (result.failed > result.refreshed) {
        console.warn(`High failure rate in token refresh for ${databaseName}: ${result.failed} failed, ${result.refreshed} succeeded`);
      }
    } catch (error) {
      console.error(`Error running proactive token refresh task:`, error);
    }
  }, {
    scheduled: true,
    timezone: `Europe/Berlin`,
  });

  console.log(`Proactive token refresh task scheduled to run every 4 hours`);
};

export const scheduleGoogleCalendarTokenRefresh = (dbPool: Pool): void => {
  cron.schedule(`0 0 3 * * *`, async () => {
    console.log(`Running scheduled task: Refreshing Google Calendar tokens...`);

    try {
      const [databaseRows] = await dbPool.query<RowDataPacket[]>(`SELECT DATABASE() as dbName`);
      const databaseName = databaseRows[0]?.dbName as string;

      console.log(`Current database: ${databaseName}`);

      const expiredIntegrations = await checkAllGoogleCalendarIntegrations(dbPool);

      if (expiredIntegrations.length > 0) {
        console.log(`Found ${expiredIntegrations.length} expired Google Calendar integrations in ${databaseName}`);

        const adminEmail = await getAdminEmailForDatabase(databaseName);

        if (adminEmail) {
          console.log(`Sending notification to database admin: ${adminEmail}`);

          const expiredEmployeeData = [];

          for (const integration of expiredIntegrations) {
            try {
              const employeeQuery = `
                SELECT employee_id, first_name, last_name
                FROM Employees
                WHERE employee_id = ?
              `;

              const [employeeRows] = await dbPool.query<EmployeeRow[]>(employeeQuery, [integration.employeeId]);

              if (employeeRows.length > 0) {
                const employee = employeeRows[0];
                expiredEmployeeData.push({
                  employeeId: employee.employee_id,
                  name: `${employee.first_name} ${employee.last_name}`,
                  calendarId: integration.calendarId
                });
              }
            } catch (error) {
              console.error(`Error getting employee data for ID ${integration.employeeId}:`, error);
            }
          }

          await sendGoogleCalendarReconnectEmail(adminEmail, {
            userName: `Admin`,
            calendarId: `multiple`,
            employeeId: 0,
            expiredEmployees: expiredEmployeeData,
          });

          console.log(`Notification sent to admin email: ${adminEmail}`);
        } else {
          console.log(`Could not find admin email for database: ${databaseName}`);
        }
      } else {
        console.log('All Google Calendar integrations are valid');
      }
    } catch (error) {
      console.error(`Error running Google Calendar tokens refresh task:`, error);
    }
  }, {
    scheduled: true,
    timezone: `Europe/Berlin`,
  });

  console.log(`Google Calendar token refresh task scheduled to run daily at 03:00`);
}