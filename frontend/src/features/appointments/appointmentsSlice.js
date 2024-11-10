import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { 
  APPOINTMENTS_SORT_RULE,
  SORT_DIRECTION,
} from '@/constants/sorting';
import { appointmentStatusEnum  } from '@/enums/enums';
import appointmentsService from "@/services/appointments.service";

export const fetchAppointments = createAsyncThunk(
  `appointments/fetchAppointments`,
  async (_arg, thunkAPI) => {    
    try {
      const state = thunkAPI.getState();

      const data = await appointmentsService.getAppointments(state.appointments.startDate, state.appointments.status);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const appointmentsSlice = createSlice({
  name: `appointments`,
  initialState: {
    data: null,
    isPending: false,
    error: null,
    sortRule: APPOINTMENTS_SORT_RULE.DATE,
    sortDirection: SORT_DIRECTION.ASC,
    startDate: null,
    status: appointmentStatusEnum.active,
  },
  reducers: {
    resetAppointmentsData: (state) => {
      state.data = null;
    },
    setSortingRule: (state, action) => {
      state.sortRule = action.payload.sortRule;
      state.sortDirection = action.payload.sortDirection;
    },
    setStartDate: (state, action) => {      
      state.startDate = action.payload.startDate;
    },
    setStatus: (state, action) => {      
      state.status = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.isPending = true;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      });
  }
});

export const { 
  setSortingRule, 
  setStartDate,
  setStatus,
  resetAppointmentsData,
} = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
