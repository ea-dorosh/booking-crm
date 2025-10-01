import { Snackbar, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { hideNotification } from '@/features/notifications/notificationsSlice';

export default function GlobalNotification() {
  const dispatch = useDispatch();
  const {
    open, message, severity, autoHideDuration,
  } = useSelector((state) => state.notifications);

  const handleClose = (event, reason) => {
    if (reason === `clickaway`) {
      return;
    }
    dispatch(hideNotification());
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{
        vertical: `bottom`,
        horizontal: `center`,
      }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: `100%` }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

