import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

const defaultTheme = createTheme();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(``);
  const [status, setStatus] = useState({
    type: ``, message: ``, 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      setStatus({
        type: `error`,
        message: `Please enter your email address`,
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({
      type: ``, message: ``, 
    });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}auth/forgot-password`, {
        method: `POST`,
        headers: {
          'Content-Type': `application/json`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: `success`,
          message: data.message || `Password reset instructions have been sent to your email`,
        });
        setEmail(``);
      } else {
        setStatus({
          type: `error`,
          message: data.message || `An error occurred. Please try again.`,
        });
      }
    } catch (error) {
      console.error(`Error:`, error);
      setStatus({
        type: `error`,
        message: `A network error occurred. Please try again later.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: `flex`,
            flexDirection: `column`,
            alignItems: `center`,
          }}
        >
          <Avatar sx={{
            m: 1, bgcolor: `secondary.main`, 
          }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Forgot Password
          </Typography>

          {status.message && (
            <Alert
              severity={status.type}
              sx={{
                mt: 2, width: `100%`, 
              }}
            >
              {status.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{
            mt: 1, width: `100%`, 
          }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3, mb: 2, 
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? `Sending...` : `Send Reset Link`}
            </Button>

            <Grid container justifyContent="center">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Back to Login
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 8 }}>
          {`Copyright © `}
          <Link color="inherit" href="#">
            Booking CRM
          </Link>{` `}
          {new Date().getFullYear()}
        </Typography>
      </Container>
    </ThemeProvider>
  );
}