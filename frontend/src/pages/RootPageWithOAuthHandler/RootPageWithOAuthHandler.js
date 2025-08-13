import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import React, {
  useEffect,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage/DashboardPage';

const RootPageWithOAuthHandler = () => {
  const location = useLocation();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Check if OAuth code is present in URL
    const processOAuthCode = () => {
      const urlParams = new URLSearchParams(location.search);
      const oauthCode = urlParams.get(`code`);

      if (!oauthCode) return false;

      setProcessing(true);

      // Save code to localStorage
      localStorage.setItem(`google_oauth_code`, oauthCode);

      // Get and save calendarId if it was set earlier
      const calendarId = localStorage.getItem(`temp_calendar_id`);

      if (calendarId) {
        localStorage.setItem(`google_calendar_id`, calendarId);
        localStorage.removeItem(`temp_calendar_id`);
      } else {
        console.warn(`No calendar ID found in localStorage!`);
      }

      // Clear URL parameters to prevent code reprocessing on page refresh
      window.history.replaceState({}, document.title, window.location.pathname);

      // Handle redirection to saved path
      const returnPath = localStorage.getItem(`google_oauth_return_path`);

      const redirectToPath = (path) => {
        setTimeout(() => {
          window.location.href = path;
        }, 500);
      };

      if (returnPath) {
        redirectToPath(returnPath);
      } else {
        console.warn(`No return path found, redirecting to /employees`);
        redirectToPath(`/employees`);
      }

      return true;
    };

    processOAuthCode();
  }, [location]);

  if (processing) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{
          minHeight: `100vh`,
          textAlign: `center`,
          p: 3,
        }}
      >
        <CircularProgress
          size={60}
          sx={{ mb: 4 }}
        />

        <Typography
          variant="h5"
          gutterBottom
        >
          Processing Google Authorization...
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
        >
          Please wait, you will be redirected automatically.
        </Typography>
      </Box>
    );
  }

  return <DashboardPage />;
};

export default RootPageWithOAuthHandler;