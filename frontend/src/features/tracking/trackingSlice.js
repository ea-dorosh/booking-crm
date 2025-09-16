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

export const fetchLinkClickStats = createAsyncThunk(
  `tracking/fetchLinkClickStats`,
  async ({
    days = 90, channel, 
  } = {}, { rejectWithValue }) => {
    try {
      const response = await trackingService.getLinkClickStats(days, channel);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || `Failed to fetch Link click stats`);
    }
  },
);

const trackingSlice = createSlice({
  name: `tracking`,
  initialState: {
    stats: null,
    linkStats: null,
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
      })
      .addCase(fetchLinkClickStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLinkClickStats.fulfilled, (state, action) => {
        state.loading = false;
        state.linkStats = action.payload;
        state.error = null;
      })
      .addCase(fetchLinkClickStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearTrackingError, clearTrackingStats,
} = trackingSlice.actions;
export default trackingSlice.reducer;