import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import appointmentsService from "@/services/appointments.service";

export const fetchAppointment = createAsyncThunk(
  `appointment/fetchAppointment`,
  async (id, thunkAPI) => {    
    try {
      const data = await appointmentsService.getAppointment(id);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const appointmentSlice = createSlice({
  name: `appointment`,
  initialState: {
    data: null,
    isPending: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointment.pending, (state) => {
        state.isPending = true;
      })
      .addCase(fetchAppointment.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = action.payload;
      })
      .addCase(fetchAppointment.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      });
  }
});

export default appointmentSlice.reducer;
