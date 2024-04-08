import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from 'react';
import PageContainer from '@/components/PageContainer/PageContainer';

const PasswordChangeForm = () => {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');

    const response = await fetch(`${process.env.REACT_APP_API_URL}auth/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    setMessage(data.message);
    
    if (response.ok) {
      // Reload the page to reflect the changes
      localStorage.removeItem('token');
      window.location.reload();
    }
  };

  return (
    <div>
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Current Password:</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Change Password</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default function AccountPage() {
  const logout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <PageContainer pageTitle="Account">
      <Typography variant="body1"  sx={{ marginTop: `20px` }}>
        Hey, here you can log out
      </Typography>

      <Button
        sx={{ marginTop: `20px` }}
        variant="contained" 
        color="primary"
        onClick={logout}>Log out
      </Button>

      <Typography variant="body1"  sx={{ marginTop: `20px` }}>
        Or change your password
      </Typography>

      <PasswordChangeForm />
    </PageContainer>
  );
}
