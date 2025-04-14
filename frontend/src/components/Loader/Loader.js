import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import React from 'react';

export default function Loader({ isOpen, message = `Loading...` }) {
  if (!isOpen) return null;

  return (
    <Box
      sx={{
        position: `fixed`,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `rgba(0, 0, 0, 0.7)`,
        zIndex: 9999,
        display: `flex`,
        flexDirection: `column`,
        alignItems: `center`,
        justifyContent: `center`,
      }}
    >
      <Box
        sx={{
          bgcolor: `white`,
          borderRadius: 2,
          p: 4,
          display: `flex`,
          flexDirection: `column`,
          alignItems: `center`,
          justifyContent: `center`,
          minWidth: 200,
        }}
      >
        <CircularProgress size={60} thickness={4} />

        <Typography variant="body1" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
}
