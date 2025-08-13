import { Box, Typography, CircularProgress } from '@mui/material';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Process OAuth callback parameters and handle navigation
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthCode = urlParams.get(`code`);
      const error = urlParams.get(`error`);

      if (error) {
        console.error(`Google OAuth error:`, error);
        navigate(`/employees`);
        return;
      }

      if (oauthCode) {
        localStorage.setItem(`google_oauth_code`, oauthCode);

        const calendarId = localStorage.getItem(`temp_calendar_id`);
        if (calendarId) {
          localStorage.setItem(`google_calendar_id`, calendarId);
          localStorage.removeItem(`temp_calendar_id`);
        } else {
          console.warn(`No calendar ID found in localStorage!`);
        }

        const returnPath = localStorage.getItem(`google_oauth_return_path`) || `/employees`;
        navigate(returnPath);
      } else {
        console.error(`No OAuth code found in callback!`);
        navigate(`/employees`);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

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
        Processing Google authentication...
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
      >
        Please wait, you will be redirected automatically.
      </Typography>
    </Box>
  );
};

export default OAuthCallbackPage;