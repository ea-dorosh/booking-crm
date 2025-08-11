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
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';

const defaultTheme = createTheme();

export default function ResetPasswordPage() {
  const [password, setPassword] = useState(``);
  const [confirmPassword, setConfirmPassword] = useState(``);
  const [token, setToken] = useState(``);
  const [status, setStatus] = useState({
    type: ``, message: ``, 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState(``);
  const [formValid, setFormValid] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Extract token from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get(`token`);

    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setStatus({
        type: `error`,
        message: `Reset token is missing. Please use the link from your email.`,
      });
    }
  }, [location]);

  // Validate form fields
  useEffect(() => {
    // Check password length
    if (password && password.length < 8) {
      setPasswordError(`Password must be at least 8 characters long`);
      setFormValid(false);
      return;
    }

    // Check if passwords match
    if (password && confirmPassword && password !== confirmPassword) {
      setPasswordError(`Passwords do not match`);
      setFormValid(false);
      return;
    }

    setPasswordError(``);
    setFormValid(password && confirmPassword && token);
  }, [password, confirmPassword, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValid) return;

    setIsSubmitting(true);
    setStatus({
      type: ``, message: ``, 
    });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}auth/reset-password`, {
        method: `POST`,
        headers: {
          'Content-Type': `application/json`,
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: `success`,
          message: data.message || `Your password has been reset successfully`,
        });

        // Clear form
        setPassword(``);
        setConfirmPassword(``);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate(`/login`);
        }, 3000);
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
            Reset Password
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
              name="password"
              label="New Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || !token}
              error={!!passwordError}
              helperText={passwordError}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting || !token}
              error={password !== confirmPassword && confirmPassword !== ``}
              helperText={password !== confirmPassword && confirmPassword !== `` ? `Passwords do not match` : ``}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3, mb: 2, 
              }}
              disabled={isSubmitting || !formValid}
            >
              {isSubmitting ? `Resetting...` : `Reset Password`}
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