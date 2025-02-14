import {
  Button,
  Typography,
  FormControl,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/PageContainer/PageContainer';
import accountService from '@/services/account.service';

const PasswordChangeForm = ({ email, cancelPasswordChange, afterPasswordChange }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      const response = await accountService.changePassword(email, currentPassword, newPassword);

      if (response.status === 200) {
        afterPasswordChange();
      }
    } catch (error) {
      setErrorMessage(error);
      setNewPassword('');
      setCurrentPassword('');
    }
  };

  return (
    <div>
      <Typography variant="h5" mb={2} mt={2}>
        Change Password
      </Typography>

      <FormControl fullWidth>
        <InputLabel>Current Password</InputLabel>
        <OutlinedInput
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </FormControl>

      <FormControl fullWidth sx={{ marginTop: '20px' }}>
        <InputLabel>New Password</InputLabel>
        <OutlinedInput
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ marginTop: '20px' }}
      >
          Change Password
      </Button>

      {errorMessage && <Typography
        variant="body1"
        sx={{ marginTop: '20px', color: 'red' }}
      >
        {errorMessage}
      </Typography>}

      <Button
        variant="outlined"
        color="primary"
        onClick={cancelPasswordChange}
        sx={{ marginTop: '20px' }}
      >
        Cancel Password Change
      </Button>
    </div>
  );
};

export default function AccountPage() {
  const [userData, setUserData] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await accountService.getCurrentUser();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <PageContainer pageTitle="Account">
      {userData && (
        <Typography variant="body1" sx={{ marginTop: '20px' }}>
          Logged in as:

          <br />

          <Typography
            variant="span"
            sx={{ fontWeight: 'bold', color: 'blue' }}
          >
            {userData.email}
          </Typography>
        </Typography>
      )}

      {!showPasswordChange && <Button
        sx={{ marginTop: '20px' }}
        variant="outlined"
        color="primary"
        onClick={() => setShowPasswordChange(true)}
      >
        Change Password
      </Button>}

      {showPasswordChange && <PasswordChangeForm
        email={userData?.email || ''}
        cancelPasswordChange={() => setShowPasswordChange(false)}
        afterPasswordChange={() => {
          setMessage('Password changed successfully')
          setShowPasswordChange(false)
        }}
      />}

      {message && <Typography
        variant="body1"
        sx={{ marginTop: '20px', color: 'green' }}
      >
        {message}
      </Typography>}

      {!showPasswordChange && <Button
        sx={{ marginTop: '20px', display: 'block' }}
        variant="contained"
        color="primary"
        onClick={logout}
      >
        Log out
      </Button>
      }
    </PageContainer>
  );
}
