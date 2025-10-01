import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import employeesService from '@/services/employees.service';

export const fetchEmployeeBlockedTimes = createAsyncThunk(
  `employeeBlockedTimes/fetchEmployeeBlockedTimes`,
  async ({
    employeeId, fromDate,
  }, thunkAPI) => {
    try {
      const data = await employeesService.getEmployeeBlockedTimes(employeeId, fromDate);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  },
);

export const createEmployeeBlockedTime = createAsyncThunk(
  `employeeBlockedTimes/createEmployeeBlockedTime`,
  async ({
    employeeId, blockedTimeData,
  }, thunkAPI) => {
    try {
      const data = await employeesService.createEmployeeBlockedTime(employeeId, blockedTimeData);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  },
);

export const updateEmployeeBlockedTime = createAsyncThunk(
  `employeeBlockedTimes/updateEmployeeBlockedTime`,
  async ({
    blockedTimeId, blockedTimeData,
  }, thunkAPI) => {
    try {
      const data = await employeesService.updateEmployeeBlockedTime(blockedTimeId, blockedTimeData);
      return {
        blockedTimeId,
        ...data,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  },
);

export const deleteEmployeeBlockedTime = createAsyncThunk(
  `employeeBlockedTimes/deleteEmployeeBlockedTime`,
  async ({ blockedTimeId }, thunkAPI) => {
    try {
      await employeesService.deleteEmployeeBlockedTime(blockedTimeId);
      return { blockedTimeId };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  },
);

const employeeBlockedTimesSlice = createSlice({
  name: `employeeBlockedTimes`,
  initialState: {
    data: [],
    isLoading: false,
    isSaving: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch blocked times
      .addCase(fetchEmployeeBlockedTimes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEmployeeBlockedTimes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchEmployeeBlockedTimes.rejected, (state) => {
        state.isLoading = false;
      })
      // Create blocked time
      .addCase(createEmployeeBlockedTime.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(createEmployeeBlockedTime.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(createEmployeeBlockedTime.rejected, (state) => {
        state.isSaving = false;
      })
      // Update blocked time
      .addCase(updateEmployeeBlockedTime.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(updateEmployeeBlockedTime.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(updateEmployeeBlockedTime.rejected, (state) => {
        state.isSaving = false;
      })
      // Delete blocked time
      .addCase(deleteEmployeeBlockedTime.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(deleteEmployeeBlockedTime.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(deleteEmployeeBlockedTime.rejected, (state) => {
        state.isSaving = false;
      });
  },
});

export default employeeBlockedTimesSlice.reducer;

