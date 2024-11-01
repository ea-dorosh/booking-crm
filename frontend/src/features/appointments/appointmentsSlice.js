import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { sortBy } from 'lodash';
import appointmentsService from "@/services/appointments.service";

export const fetchAppointments = createAsyncThunk(
  `appointments/fetchAppointments`,
  async (thunkAPI) => {
    try {
      const data = await appointmentsService.getAppointments();
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
    sortingRule: `date`,
    direction: `asc`,
  },
  reducers: {
    setSortingRule: (state, action) => {
      state.sortingRule = action.payload.rule;
      state.direction = action.payload.direction;
      if (state.data) {
        state.data = applySorting(state.data, state.sortingRule, state.direction);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.isPending = true;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = applySorting(action.payload, 'date', 'asc', 'timeStart');
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      });
  }
});

const applySorting = (data, rule, direction, secondaryRule = 'timeStart') => {
  const sortedData = sortBy(data, [rule, secondaryRule]);
  return direction === 'des' ? sortedData.reverse() : sortedData;
};

export const { setSortingRule } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
