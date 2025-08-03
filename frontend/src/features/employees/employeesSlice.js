import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import employeesService from "@/services/employees.service";

export const fetchEmployees = createAsyncThunk(
  `employees/fetchEmployees`,
  async (_arg, thunkAPI) => {
    try {
      const data = await employeesService.getEmployees();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchEmployeeAppointments = createAsyncThunk(
  `customer/fetchEmployeeLastAppointments`,
  async ({ id, filters = {} }, thunkAPI) => {
    try {
      const data = await employeesService.getEmployeeAppointments(id, filters);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateEmployee = createAsyncThunk(
  `employees/updateEmployee`,
  async (employeeFormData, thunkAPI) => {
    try {
      if (employeeFormData.employeeId !== undefined) {
        await employeesService.updateEmployee(employeeFormData);
      }
      else {
        const { data } = await employeesService.createEmployee(employeeFormData);

        return data;
      }
    } catch (error) {
      // Handle validation errors that are already objects
      if (error.errors) {
        return thunkAPI.rejectWithValue(error.errors);
      }

      // Handle string errors that need parsing
      try {
        const parsedErrors = JSON.parse(error.message);
        return thunkAPI.rejectWithValue(parsedErrors);
      } catch {
        // If parsing fails, return the error as is
        return thunkAPI.rejectWithValue({ general: error.message });
      }
    }
  }
);

const employeesSlice = createSlice({
  name: `employees`,
  initialState: {
    data: [],
    isCustomersDataRequestPending: false,
    error: null,
    updateFormData: null,
    updateFormStatus: `idle`,
    updateFormErrors: null,
    lastAppointments: null,
    isLastAppointmentsPending: false,
    lastAppointmentsError: null,
  },
  reducers: {
    cleanError: (state, action) => {
      const fieldName = action.payload;

      if (state.updateFormErrors[fieldName]) {
        delete state.updateFormErrors[fieldName];
      }
    },
    cleanErrors: (state) => {
      state.updateFormErrors = null;
    },
    resetUpdateFormStatus: (state) => {
      state.updateFormStatus = `idle`;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isCustomersDataRequestPending = true;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isCustomersDataRequestPending = false;
        state.data = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isCustomersDataRequestPending = false;
        state.error = action.payload;
      })
      .addCase(updateEmployee.pending, (state) => {
        state.updateFormStatus = `loading`;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.updateFormStatus = `succeeded`;
        state.updateFormData = action.payload;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.updateFormStatus = `failed`;
        state.updateFormErrors = action.payload;
      })
      .addCase(fetchEmployeeAppointments.pending, (state) => {
        state.lastAppointmentsError = null;
        state.isLastAppointmentsPending = true;
      })
      .addCase(fetchEmployeeAppointments.fulfilled, (state, action) => {
        state.isLastAppointmentsPending = false;
        state.lastAppointments = action.payload;
      })
      .addCase(fetchEmployeeAppointments.rejected, (state, action) => {
        state.isLastAppointmentsPending = false;
        state.lastAppointmentsError = action.payload;
      })
  }
});

export const {
  cleanError,
  cleanErrors,
  resetUpdateFormStatus,
} = employeesSlice.actions;
export default employeesSlice.reducer;
