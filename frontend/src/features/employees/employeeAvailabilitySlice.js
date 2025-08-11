/* eslint-disable no-unused-vars */
import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import employeesService from '@/services/employees.service';

export const fetchEmployeeAvailability = createAsyncThunk(
  `employeeAvailability/fetchEmployeeAvailability`,
  async (employeeId, thunkAPI) => {
    try {
      const data = await employeesService.getEmployeeAvailability(employeeId);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const applyEmployeeAvailability = createAsyncThunk(
  `employeeAvailability/applyEmployeeAvailability`,
  async (newEmployeeAvailabilityData, thunkAPI) => {
    try {
      await employeesService.applyEmployeeAvailability(newEmployeeAvailabilityData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const deleteEmployeeAvailability = createAsyncThunk(
  `employeeAvailability/deleteEmployeeAvailability`,
  async (employeeId, thunkAPI) => {
    try {
      await employeesService.deleteEmployeeAvailability(employeeId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

const employeesSlice = createSlice({
  name: `employeeAvailability`,
  initialState: {
    data: [],
    status: `idle`,
    error: null,
    applyEmployeeAvailabilityStatus: `idle`,
    applyEmployeeAvailabilityError: null,
    deleteEmployeeAvailabilityStatus: `idle`,
    deleteEmployeeAvailabilityError: null,
  },
  reducers: {
    cleanEmployeeAvailability: (state) => {
      state.data = [];
      state.status = `idle`;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeAvailability.pending, (state) => {
        state.status = `loading`;
      })
      .addCase(fetchEmployeeAvailability.fulfilled, (state, action) => {
        state.status = `succeeded`;
        state.data = action.payload;
      })
      .addCase(fetchEmployeeAvailability.rejected, (state, action) => {
        state.status = `failed`;
        state.error = action.payload;
      })
      .addCase(applyEmployeeAvailability.pending, (state) => {
        state.applyEmployeeAvailabilityStatus = `loading`;
      })
      .addCase(applyEmployeeAvailability.fulfilled, (state) => {
        state.applyEmployeeAvailabilityStatus = `succeeded`;
      })
      .addCase(applyEmployeeAvailability.rejected, (state, action) => {
        state.applyEmployeeAvailabilityStatus = `failed`;
        state.applyEmployeeAvailabilityError = action.payload;
      })
      .addCase(deleteEmployeeAvailability.pending, (state) => {
        state.applyEmployeeAvailabilityStatus = `loading`;
      })
      .addCase(deleteEmployeeAvailability.fulfilled, (state) => {
        state.applyEmployeeAvailabilityStatus = `succeeded`;
      })
      .addCase(deleteEmployeeAvailability.rejected, (state, action) => {
        state.applyEmployeeAvailabilityStatus = `failed`;
        state.applyEmployeeAvailabilityError = action.payload;
      })
  },
});

export const { cleanEmployeeAvailability } = employeesSlice.actions;
export default employeesSlice.reducer;