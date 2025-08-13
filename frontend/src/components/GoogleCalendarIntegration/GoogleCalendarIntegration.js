import { Google, CalendarMonth, Check, Link, Sync } from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Divider,
  Alert,
  TextField,
  Card,
  CardContent,
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

  // Effect to load integration status when component mounts
  useEffect(() => {
    if (employeeId) {
      fetchStatus();
    }
  }, [employeeId]);

  // Effect to check for OAuth code in localStorage on load
  useEffect(() => {
    const oauthCode = localStorage.getItem(`google_oauth_code`);
    const savedCalendarId = localStorage.getItem(`google_calendar_id`) || calendarId;

    if (oauthCode && employeeId && savedCalendarId) {
      handleAuthCallback(oauthCode, savedCalendarId);
      localStorage.removeItem(`google_oauth_code`);
      localStorage.removeItem(`google_calendar_id`);
    }
  }, []);  // Only runs on component mount

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

  const handleConnect = async () => {
    if (!calendarId) {
      setError(`Please enter your Google Calendar ID`);
      return;
    }

    try {
      setLoading(true);

      // Save calendarId to localStorage before redirecting
      localStorage.setItem(`temp_calendar_id`, calendarId);

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
        message: `Synchronization complete: ${response.data.results.synced} entries added to calendar, ${response.data.results.failed} failed to add.`,
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

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        my={3}>
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
        }}
      >
        Google Calendar Integration
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}>
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
        <Card
          variant="outlined"
          sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}>
              <Google
                color="primary" />
              <Typography
                variant="h6">Google Calendar Connected</Typography>
              <Chip
                icon={<Check />}
                label="Active"
                color="success"
                size="small"
                sx={{ ml: `auto` }}
              />
            </Stack>

            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: `background.paper`,
                borderRadius: 1,
              }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}>
                <CalendarMonth
                  fontSize="small"
                  color="action" />
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Calendar ID:
                </Typography>
                <Typography
                  variant="body1">
                  {status.calendarId}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={1}>
                <Link
                  fontSize="small"
                  color="action" />
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Status:
                </Typography>
                <Typography
                  variant="body1"
                  color="success.main">
                  Synchronizing appointments
                </Typography>
              </Stack>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}>
              Appointments will be automatically synced with this Google Calendar.
            </Typography>

            <Stack
              direction="row"
              spacing={2}>
              <Button
                variant="outlined"
                color="error"
                onClick={removeIntegration}
                disabled={loading}
                startIcon={<Google />}
              >
                Disconnect Calendar
              </Button>

              <Button
                variant="outlined"
                color="primary"
                onClick={syncMissingAppointments}
                disabled={syncLoading}
                startIcon={<Sync />}
              >
                {syncLoading ? `Synchronizing...` : `Sync Missed Appointments`}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {status.tokenExpired ? (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}>
              Google Calendar access has expired. You need to reauthorize.
            </Alert>
          ) : (
            <Typography
              variant="body1"
              sx={{ mb: 2 }}>
              Connect this employee to their Google Calendar to synchronize appointments.
            </Typography>
          )}

          <TextField
            label="Google Calendar ID"
            variant="outlined"
            fullWidth
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            helperText="Enter the employee's Google Calendar ID (e.g., email@gmail.com)"
            sx={{ mb: 2 }}
          />

          <Box
            sx={{ mb: 2 }}>
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
            }}>
            You will be redirected to Google to authorize access to the calendar.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GoogleCalendarIntegration;
