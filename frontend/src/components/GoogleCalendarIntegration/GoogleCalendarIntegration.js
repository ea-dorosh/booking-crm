import { Google, CalendarMonth, Check, Link, Sync, Delete } from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Divider,
  Alert,
  TextField,
  Stack,
  Chip,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import axios from '../../services/axios.service.js';

const GoogleCalendarIntegration = ({ employeeId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({
    enabled: false,
    calendarId: null,
  });
  const [calendarId, setCalendarId] = useState(``);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [calendars, setCalendars] = useState([]);

  // Effect to load integration status when component mounts
  useEffect(() => {
    if (employeeId) {
      fetchStatus();
      fetchCalendars();
    }
  }, [employeeId]);

  // Effect to check for OAuth code in localStorage when dependencies are ready
  useEffect(() => {
    const oauthCode = localStorage.getItem(`google_oauth_code`);
    const savedCalendarId = localStorage.getItem(`google_calendar_id`) || calendarId;

    if (oauthCode && employeeId && savedCalendarId) {
      handleAuthCallback(oauthCode, savedCalendarId);
      localStorage.removeItem(`google_oauth_code`);
      localStorage.removeItem(`google_calendar_id`);
    }
  }, [employeeId, calendarId]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/google-calendar/${employeeId}/google-calendar-status`);
      setStatus(response.data);

      // If token is expired, show appropriate error
      if (response.data.tokenExpired) {
        setError(`Your Google Calendar integration has expired. Please reconnect your calendar.`);
      } else if (response.data.calendarId) {
        setCalendarId(response.data.calendarId);
      }
    } catch (error) {
      console.error(`Error fetching Google Calendar status:`, error);
      setError(`Failed to load Google Calendar integration status`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await axios.get(`/google-calendar/${employeeId}/calendars`);
      setCalendars(response.data?.calendars || []);
    } catch (error) {
      console.error(`Error fetching calendars list:`, error);
    }
  };

  const startOAuthWithCalendarId = async (targetCalendarId) => {
    if (!targetCalendarId) {
      setError(`Please enter your Google Calendar ID`);
      return;
    }

    try {
      setLoading(true);

      // Save calendarId to localStorage before redirecting
      localStorage.setItem(`temp_calendar_id`, targetCalendarId);

      // Save current path for return
      localStorage.setItem(`google_oauth_return_path`, window.location.pathname);

      // Get Google auth URL
      const response = await axios.get(`/google-calendar/auth-url?employeeId=${employeeId}`);

      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        setError(`Failed to get Google authorization URL`);
      }
    } catch (error) {
      console.error(`Error initiating Google Calendar authentication:`, error);
      setError(`Failed to initiate Google Calendar integration`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    await startOAuthWithCalendarId(calendarId);
  };

  const reconnectCalendar = async (reconnectCalendarId) => {
    await startOAuthWithCalendarId(reconnectCalendarId);
  };

  const handleAuthCallback = async (code, idToUse) => {
    if (!code || !idToUse) {
      setError(`Authorization code and calendar ID are required`);
      return;
    }

    try {
      setLoading(true);

      // Ensure employeeId is passed as a number
      const numericEmployeeId = Number(employeeId);

      await axios.post(`/google-calendar/auth-callback`, {
        code,
        employeeId: numericEmployeeId,
        calendarId: idToUse,
      });

      // Update status after successful integration
      await fetchStatus();
      await fetchCalendars();
      setError(null);
    } catch (error) {
      console.error(`Error handling Google auth callback:`, error);
      console.error(`Error details:`, error.response?.data || error.message);
      setError(`Failed to complete Google Calendar integration`);
    } finally {
      setLoading(false);
    }
  };

  const removeIntegration = async () => {
    if (!window.confirm(`Are you sure you want to remove Google Calendar integration?`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/google-calendar/${employeeId}/google-calendar`);
      await fetchStatus();
      await fetchCalendars();
    } catch (error) {
      console.error(`Error removing Google Calendar integration:`, error);
      setError(`Failed to remove Google Calendar integration`);
    } finally {
      setLoading(false);
    }
  };

  // Function to sync missing appointments
  const syncMissingAppointments = async () => {
    try {
      setSyncLoading(true);
      setSyncResult(null);

      const response = await axios.post(`/google-calendar/${employeeId}/sync-appointments`);

      // Show success message with results
      setSyncResult({
        success: true,
        message: `Synchronization complete: ${response.data.results.synced} entries added to calendar, ${response.data.results.failed} failed to add`,
      });

      // Refresh status
      await fetchStatus();
    } catch (error) {
      console.error(`Error syncing appointments:`, error);
      setSyncResult({
        success: false,
        message: `Synchronization error: ${error.response?.data?.error || error.message}`,
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const deleteCalendar = async (idToDelete) => {
    if (!window.confirm(`Удалить календарь ${idToDelete}?`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/google-calendar/${employeeId}/calendars/${encodeURIComponent(idToDelete)}`);
      await fetchCalendars();
      await fetchStatus();
    } catch (error) {
      console.error(`Error deleting calendar:`, error);
      setError(error?.response?.data?.error || `Failed to delete calendar`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        my={3}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontSize: `1rem`,
          mb: 2,
        }}
      >
        Google Calendar Integration
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {syncResult && (
        <Alert
          severity={syncResult.success ? `success` : `error`}
          sx={{ mb: 2 }}
          onClose={() => setSyncResult(null)}
        >
          {syncResult.message}
        </Alert>
      )}

      {status.enabled ? (
        <>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Google color="primary" />

            <Typography
              variant="h6"
              fontSize=".75rem"
              sx={{ mr: `10px` }}
            >
              Google Calendar Connected
            </Typography>

            <Chip
              icon={<Check />}
              label="Active"
              color="success"
              size="small"
              sx={{ ml: `auto !important` }}
            />
          </Stack>

          <Box
            sx={{
              mb: 2,
              p: 0,
              bgcolor: `background.paper`,
              borderRadius: 1,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                mb: 1,
              }}
            >
              <CalendarMonth
                fontSize="small"
                color="action"
              />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Calendar ID:
              </Typography>

              <Typography
                variant="body1"
                sx={{ hyphens: `auto` }}
              >
                {status.calendarId}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Link
                fontSize="small"
                color="action"
              />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                  Status:
              </Typography>

              <Typography
                variant="body1"
                color="success.main"
              >
                  Synchronizing appointments
              </Typography>
            </Stack>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
              Appointments will be automatically synced with this Google Calendar.
          </Typography>

          <Stack
            direction="column"
            spacing={2}
          >
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={removeIntegration}
              disabled={loading}
              startIcon={<Google />}
            >
                Disconnect Calendar
            </Button>

            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={syncMissingAppointments}
              disabled={syncLoading}
              startIcon={<Sync />}
            >
              {syncLoading ? `Synchronizing...` : `Sync Missed Appointments`}
            </Button>
          </Stack>
        </>
      ) : (
        <Box>
          {status.tokenExpired ? (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
            >
              Google Calendar access has expired. You need to reauthorize.
            </Alert>
          ) : (
            <Typography
              variant="body1"
              sx={{ mb: 2 }}
            >
              Connect this employee to their Google Calendar to synchronize appointments.
            </Typography>
          )}

          <TextField
            label="Google Calendar ID"
            variant="outlined"
            fullWidth
            value={calendarId}
            onChange={(event) => setCalendarId(event.target.value)}
            helperText="Enter the employee's Google Calendar ID (e.g., email@gmail.com)"
            sx={{ mb: 2 }}
          />

          <Box
            sx={{ mb: 2 }}
          >
            <Button
              variant="contained"
              onClick={handleConnect}
              disabled={!calendarId || loading}
              startIcon={<Google />}
            >
              {status.tokenExpired ? `Reconnect Calendar` : `Connect to Google Calendar`}
            </Button>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: `text.secondary`,
              mt: 2,
            }}
          >
            You will be redirected to Google to authorize access to the calendar.
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontSize: `1rem` }}
      >
        Linked Calendars
      </Typography>

      {calendars.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          No linked calendars found.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {calendars.map((calendar) => (

            <Stack
              key={`${calendar.calendarId}-${calendar.updatedAt || ``}`}
              sx={{
                flexWrap: `wrap`,
                justifyContent: `flex-start`,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  mb: 1,
                  flexWrap: `wrap`,
                  justifyContent: `flex-start`,
                }}
              >
                <CalendarMonth
                  fontSize="small"
                  color="action"
                />

                <Typography variant="body1">
                  {calendar.calendarId}
                </Typography>

                {calendar.googleEmail && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    ({calendar.googleEmail})
                  </Typography>
                )}

                <Chip
                  label={calendar.isActive ? `Active` : `Inactive`}
                  color={calendar.isActive ? `success` : `default`}
                  size="small"
                  sx={{
                    ml: `auto`,
                    flexShrink: 0,
                  }}
                />
              </Stack>

              {typeof calendar.errorCount === `number` && calendar.errorCount > 0 && (
                <Chip
                  label={`Errors: ${calendar.errorCount}`}
                  color="warning"
                  size="small"
                  sx={{
                    flexShrink: 0,
                    alignSelf: `flex-start`,
                  }}
                />
              )}

              <Stack
                direction="row"
                spacing={2}
                sx={{ mt: 1 }}
                alignItems="center"
              >
                <Box sx={{ ml: `auto` }}>
                  {!calendar.isActive && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<Google />}
                      onClick={() => reconnectCalendar(calendar.calendarId)}
                      disabled={loading}
                      sx={{ mr: 1 }}
                    >
                      Reconnect
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => deleteCalendar(calendar.calendarId)}
                    disabled={calendar.isActive || loading}
                    title={calendar.isActive ? `Disconnect calendar first to delete` : `Delete calendar`}
                  >
                    Delete
                  </Button>
                </Box>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default GoogleCalendarIntegration;
