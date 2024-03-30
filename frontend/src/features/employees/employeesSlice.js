/* eslint-disable no-unused-vars */
import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import employeesService from "@/services/employees.service";

export const fetchEmployees = createAsyncThunk(
  `employees/fetchEmployees`,
  async (thunkAPI) => {
    try {
      const data = await employeesService.getEmployees();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateEmployee = createAsyncThunk(
  `employees/updateEmployee`,
  async (employeFormData, thunkAPI) => {
    try {
      if (employeFormData.employeeId !== undefined) {
        await employeesService.updateEmployee(employeFormData);
      }
      else {
        const { data } = await employeesService.createEmployee(employeFormData);

        return data;
      }
    } catch (error) {
      const parsedErrors = await JSON.parse(error.message);
      return thunkAPI.rejectWithValue(parsedErrors);
    }
  }
);

const employeesSlice = createSlice({
  name: `employees`,
  initialState: {
    data: [],
    status: `idle`,
    error: null,
    updateFormData: null,
    updateFormStatus: `idle`,
    updateFormErrors: null,
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
        state.status = `loading`;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = `succeeded`;
        state.data = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = `failed`;
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
  }
});

export const { 
  cleanError, 
  cleanErrors,
  resetUpdateFormStatus,
} = employeesSlice.actions;
export default employeesSlice.reducer;