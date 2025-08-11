import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import trackingService from '@/services/tracking.service';

// Async thunk for fetching QR scan stats
export const fetchQrScanStats = createAsyncThunk(
  `tracking/fetchQrScanStats`,
  async (days = 90, { rejectWithValue }) => {
    try {
      const response = await trackingService.getQrScanStats(days);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || `Failed to fetch QR scan stats`);
    }
  },
);

const trackingSlice = createSlice({
  name: `tracking`,
  initialState: {
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearTrackingError: (state) => {
      state.error = null;
    },
    clearTrackingStats: (state) => {
      state.stats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQrScanStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQrScanStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchQrScanStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearTrackingError, clearTrackingStats, 
} = trackingSlice.actions;
export default trackingSlice.reducer;