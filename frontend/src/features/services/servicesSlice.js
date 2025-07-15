import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import servicesService from "@/services/services.service";

export const fetchServices = createAsyncThunk(
  `services/fetchServices`,
  async (_arg, thunkAPI) => {
    try {
      const data = await servicesService.getServices();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateService = createAsyncThunk(
  `services/updateService`,
  async (formData, thunkAPI) => {
    try {
      if (formData.id !== undefined) {
        await servicesService.updateService(formData);
      } else {
        const { data } = await servicesService.createService(formData);

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

export const deleteService = createAsyncThunk(
  `services/deleteService`,
  async (serviceId, thunkAPI) => {
    try {
      return await servicesService.deleteService(serviceId);
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

const servicesSlice = createSlice({
  name: `services`,
  initialState: {
    data: null,
    isServicesRequestPending: false,
    error: null,
    updateFormData: null,
    isUpdateServiceRequestPending: false,
    updateFormErrors: null,
  },
  reducers: {
    cleanError: (state, action) => {
      const fieldName = action.payload;

      if (state.updateFormErrors && state.updateFormErrors[fieldName]) {
        delete state.updateFormErrors[fieldName];
      }
    },
    cleanErrors: (state) => {
      state.updateFormErrors = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.isServicesRequestPending = true;
        state.data = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.isServicesRequestPending = false;
        state.data = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isServicesRequestPending = false;
        state.error = action.payload;
      })
      .addCase(updateService.pending, (state) => {
        state.isUpdateServiceRequestPending = true;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.isUpdateServiceRequestPending = false;
        state.updateFormData = action.payload;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.isUpdateServiceRequestPending = false;
        state.updateFormErrors = action.payload;
      })
      .addCase(deleteService.pending, (state) => {
        state.isUpdateServiceRequestPending = true;
        state.deleteServiceErrors = null;
      })
      .addCase(deleteService.fulfilled, (state) => {
        state.isUpdateServiceRequestPending = false;
      })
      .addCase(deleteService.rejected, (state) => {
        state.isUpdateServiceRequestPending = false;
      })
  }
});

export const {
  cleanError,
  cleanErrors,
} = servicesSlice.actions;
export default servicesSlice.reducer;
