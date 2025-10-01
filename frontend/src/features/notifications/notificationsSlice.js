import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: `notifications`,
  initialState: {
    open: false,
    message: ``,
    severity: `info`, // 'success' | 'error' | 'warning' | 'info'
    autoHideDuration: 3000,
  },
  reducers: {
    showNotification: (state, action) => {
      state.open = true;
      state.message = action.payload.message;
      state.severity = action.payload.severity || `info`;
      state.autoHideDuration = action.payload.autoHideDuration || 3000;
    },
    hideNotification: (state) => {
      state.open = false;
    },
    showSuccess: (state, action) => {
      state.open = true;
      state.message = action.payload;
      state.severity = `success`;
      state.autoHideDuration = 3000;
    },
    showError: (state, action) => {
      state.open = true;
      state.message = action.payload;
      state.severity = `error`;
      state.autoHideDuration = 4000;
    },
    showWarning: (state, action) => {
      state.open = true;
      state.message = action.payload;
      state.severity = `warning`;
      state.autoHideDuration = 3500;
    },
    showInfo: (state, action) => {
      state.open = true;
      state.message = action.payload;
      state.severity = `info`;
      state.autoHideDuration = 3000;
    },
  },
});

export const {
  showNotification,
  hideNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

