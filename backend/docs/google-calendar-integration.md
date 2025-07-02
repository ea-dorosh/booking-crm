# Google Calendar Integration Documentation

This document provides a comprehensive guide to the Google Calendar integration in the Booking CRM system. It covers all aspects of the implementation from Google Cloud Console setup to frontend and backend code flow.

## Table of Contents
1. [Overview](#overview)
2. [Google Cloud Console Setup](#google-cloud-console-setup)
3. [Environment Variables](#environment-variables)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Authentication Flow](#authentication-flow)
7. [Development vs Production](#development-vs-production)
8. [Troubleshooting](#troubleshooting)

## Overview

The Google Calendar integration allows employees to connect their Google Calendars to the CRM system. When an appointment is created, updated, or deleted in the CRM, it will automatically synchronize with the employee's Google Calendar.

Key features include:
- OAuth 2.0 authorization with Google
- Automatic synchronization of appointments
- Manual sync of missed appointments
- Token refresh handling
- Calendar availability checking

## Google Cloud Console Setup

### Prerequisites
1. A Google account with access to [Google Cloud Console](https://console.cloud.google.com/)
2. Google Calendar API enabled for your project

### Development Environment Setup (Desktop Application)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to "APIs & Services" > "Dashboard"
4. Click "ENABLE APIS AND SERVICES", search for "Google Calendar API" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Click "CREATE CREDENTIALS" > "OAuth client ID"
7. Select "Desktop app" as application type
8. Give it a name (e.g., "Booking CRM Dev")
9. Click "CREATE" to generate Client ID and Client Secret
10. Save the Client ID and Client Secret for development environment (.env.development)

### Production Environment Setup (Web Application)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "CREATE CREDENTIALS" > "OAuth client ID"
5. Select "Web application" as application type
6. Give it a name (e.g., "Booking CRM Web Client")
7. Add your production domain to "Authorized JavaScript origins" (e.g., `https://domen.org`)
8. Add your redirect URI to "Authorized redirect URIs" (e.g., `https://domen.org/google-callback`)
9. Click "CREATE" to generate Client ID and Client Secret
10. Save the Client ID and Client Secret for production environment (.env.production)

### OAuth Consent Screen

1. Go to "OAuth consent screen" tab
2. Select "External" or "Internal" user type (Internal if using Google Workspace organization)
3. Fill in the app information:
   - App name: "Booking CRM"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.profile` (optional, for better user identification)
   - `https://www.googleapis.com/auth/userinfo.email` (optional, for better user identification)
5. Add test users if necessary
6. Complete the verification process if needed

**ВАЖНО для продакшена:**
- Убедитесь что приложение verified (проверено Google)
- Используйте Internal user type если у вас Google Workspace
- Настройте правильные домены в authorized origins

### Улучшенные настройки для надежности

Для максимальной надежности refresh токенов добавьте следующие настройки:

1. **В Google Cloud Console:**
   - Включите "Google Calendar API"
   - Включите "People API" (для лучшей идентификации пользователей)
   - В OAuth consent screen установите Internal если возможно
   - Добавьте все необходимые домены и поддомены

2. **Дополнительные scopes для лучшей интеграции:**
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/userinfo.profile
   https://www.googleapis.com/auth/userinfo.email
   ```

## Environment Variables

### Development (.env.development)

```
GOOGLE_CLIENT_ID=<desktop_application_client_id>
GOOGLE_CLIENT_SECRET=<desktop_application_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:3000
NODE_ENV=development
```

### Production (.env.production)

```
GOOGLE_CLIENT_ID=<web_application_client_id>
GOOGLE_CLIENT_SECRET=<web_application_client_secret>
GOOGLE_REDIRECT_URI=https://domen.org/google-callback
NODE_ENV=production
```

## Backend Implementation

### Key Files

1. **googleCalendarService.ts** - Core service for Google Calendar interactions
2. **googleCalendarRoute.ts** - API endpoints for Google Calendar integration
3. **schedulerService.ts** - Background service for token refresh

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/protected/google-calendar/auth-url` | GET | Get OAuth authorization URL |
| `/api/protected/google-calendar/auth-callback` | POST | Process OAuth callback with authorization code |
| `/api/protected/google-calendar/:employeeId/google-calendar-status` | GET | Check employee's Google Calendar connection status |
| `/api/protected/google-calendar/:employeeId/google-calendar` | DELETE | Remove Google Calendar integration for an employee |
| `/api/protected/google-calendar/:employeeId/sync-appointments` | POST | Manually sync missed appointments to Google Calendar |
| `/api/protected/google-calendar/check-all-integrations` | POST | Check all employees' Google Calendar integrations |

### Database Tables

The integration uses the `EmployeeGoogleCalendar` table with the following structure:

```sql
CREATE TABLE EmployeeGoogleCalendar (
  employee_id INT PRIMARY KEY,
  refresh_token TEXT NOT NULL,
  calendar_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### OAuth 2.0 Flow in Backend

1. **getOAuth2Client** - Creates an OAuth2 client with credentials from environment variables
   ```typescript
   const oauth2Client = new google.auth.OAuth2(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET,
     process.env.GOOGLE_REDIRECT_URI
   );
   ```

2. **getAuthUrl** - Generates authorization URL with appropriate scopes
   ```typescript
   const authUrl = oauth2Client.generateAuthUrl({
     access_type: 'offline',
     scope: [
       'https://www.googleapis.com/auth/calendar',
       'https://www.googleapis.com/auth/calendar.events'
     ],
     prompt: 'consent',
     include_granted_scopes: true
   });
   ```

3. **getTokensByCode** - Exchanges authorization code for tokens
   ```typescript
   const { tokens } = await oauth2Client.getToken(code);
   ```

4. **saveEmployeeGoogleCalendarCredentials** - Saves refresh token and calendar ID to database
   ```typescript
   await dbPool.query(
     'INSERT INTO EmployeeGoogleCalendar (employee_id, refresh_token, calendar_id) VALUES (?, ?, ?)',
     [employeeId, refreshToken, calendarId]
   );
   ```

### Development vs Production Differences

In `googleCalendarRoute.ts`, device parameters are added only in development environment:
```typescript
// Add device params only in development environment
if (process.env.NODE_ENV !== 'production') {
  const deviceParams = {
    device_id: `booking_crm_client_${employeeId}_${Date.now()}`,
    device_name: 'Booking CRM Client'
  };
  finalAuthUrl = `${authUrl}&${new URLSearchParams(deviceParams).toString()}`;
}
```

## Frontend Implementation

### Key Files

1. **GoogleCalendarIntegration.js** - React component for Google Calendar integration UI
2. **OAuthCallbackPage.js** - Page to handle OAuth redirects and code processing
3. **router.js** - Defines routes including Google callback route

### GoogleCalendarIntegration Component

This component handles:
1. Displaying connection status
2. Initiating OAuth flow
3. Displaying calendar ID
4. Sync missed appointments functionality
5. Disconnect calendar functionality

### Authentication Flow in Frontend

1. **Initiating OAuth flow**:
   ```javascript
   const handleConnect = async () => {
     // Save calendar ID to localStorage before redirecting
     localStorage.setItem('temp_calendar_id', calendarId);

     // Save current path for return
     localStorage.setItem('google_oauth_return_path', window.location.pathname);

     // Get auth URL from backend
     const response = await axios.get(`/google-calendar/auth-url?employeeId=${employeeId}`);

     // Redirect to Google authorization page
     window.location.href = response.data.url;
   };
   ```

2. **Handling OAuth callback** (in OAuthCallbackPage.js):
   ```javascript
   const handleOAuthCallback = () => {
     const urlParams = new URLSearchParams(window.location.search);
     const oauthCode = urlParams.get('code');

     if (oauthCode) {
       localStorage.setItem('google_oauth_code', oauthCode);
       const calendarId = localStorage.getItem('temp_calendar_id');

       if (calendarId) {
         localStorage.setItem('google_calendar_id', calendarId);
         localStorage.removeItem('temp_calendar_id');
       }

       const returnPath = localStorage.getItem('google_oauth_return_path') || '/employees';
       navigate(returnPath);
     }
   };
   ```

3. **Processing authorization code**:
   ```javascript
   useEffect(() => {
     const oauthCode = localStorage.getItem('google_oauth_code');
     const savedCalendarId = localStorage.getItem('google_calendar_id') || calendarId;

     if (oauthCode && employeeId && savedCalendarId) {
       handleAuthCallback(oauthCode, savedCalendarId);
       localStorage.removeItem('google_oauth_code');
       localStorage.removeItem('google_calendar_id');
     }
   }, []);
   ```

4. **Sending code to backend**:
   ```javascript
   const handleAuthCallback = async (code, idToUse) => {
     await axios.post('/google-calendar/auth-callback', {
       code,
       employeeId: Number(employeeId),
       calendarId: idToUse
     });

     await fetchStatus();
   };
   ```

## Authentication Flow

The complete OAuth 2.0 flow in the application:

1. **Initiate Authentication**
   - User clicks "Connect to Google Calendar" button
   - Frontend saves calendar ID and return path in localStorage
   - Frontend requests authorization URL from backend
   - Backend generates OAuth URL based on environment
   - Frontend redirects user to Google authorization page

2. **Google Authorization**
   - User grants permissions to the application
   - Google redirects back to application's redirect URI with authorization code

3. **Process Authorization Code**
   - OAuthCallbackPage component extracts code from URL
   - Component saves code in localStorage and redirects back to original page
   - Original component retrieves code from localStorage
   - Component sends code to backend API

4. **Backend Token Exchange**
   - Backend exchanges code for refresh token and access token
   - Backend saves refresh token and calendar ID in database
   - Backend sends success response to frontend

5. **Using Google Calendar API**
   - Backend creates OAuth client with stored refresh token
   - Backend automatically refreshes access token when needed
   - Backend uses tokens to interact with Google Calendar API

## Development vs Production

### Development Environment
- Uses **Desktop Application** OAuth client type
- Redirect URI is `http://localhost:3000/google-callback`
- Can use device parameters in authorization URL
- Suitable for local testing

### Production Environment
- Uses **Web Application** OAuth client type
- Redirect URI is `https://domen.org/google-callback`
- Cannot use device parameters (will cause errors)
- Requires proper JavaScript origins and redirect URIs in Google Cloud Console

## Troubleshooting

### Common Errors

1. **redirect_uri_mismatch**
   - **Cause**: The redirect URI in the request doesn't match URIs configured in Google Cloud Console
   - **Solution**: Verify that GOOGLE_REDIRECT_URI in .env file matches exactly what's in Google Cloud Console

2. **invalid_grant**
   - **Cause**: The refresh token is expired or revoked
   - **Solution**: Re-authorize the application

3. **invalid_request / Device info can be set only for native apps**
   - **Cause**: Using device parameters with Web Application client
   - **Solution**: Ensure NODE_ENV is set to 'production' in production environment

4. **No refresh token received**
   - **Cause**: Missing access_type=offline or prompt=consent in authUrl
   - **Solution**: Verify getAuthUrl function includes these parameters

### Debugging Tips

1. Check environment variables are correctly set
2. Inspect browser console for frontend errors
3. Check server logs for backend errors
4. Verify that the OAuth client type matches the environment
5. Ensure you're using the correct Client ID and Secret for each environment