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

export const fetchServiceCategories = createAsyncThunk(
  `services/fetchServiceCategories`,
  async (thunkAPI) => {
    console.log(`fetchServiceCategories`);
    try {
      const data = await servicesService.getServiceCategories();

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
      const parsedErrors = await JSON.parse(error.message);
      return thunkAPI.rejectWithValue(parsedErrors);
    }
  }
);

export const deleteService = createAsyncThunk(
  `services/deleteService`,
  async (serviceId, thunkAPI) => {
    try {
      const { data } = await servicesService.deleteService(serviceId);

      return data;
    } catch (error) {
      const parsedErrors = await JSON.parse(error.message);
      return thunkAPI.rejectWithValue(parsedErrors);
    }
  }
);

const servicesSlice = createSlice({
  name: `services`,
  initialState: {
    data: [],
    serviceCategories: null,
    status: `idle`,
    error: null,
    updateFormData: null,
    updateFormStatus: `idle`,
    updateFormErrors: null,
    deleteServiceData: null,
    deleteServiceStatus: `idle`,
    deleteServiceErrors: null,
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
    resetDeleteServiceStatus: (state) => {
      state.deleteServiceStatus = `idle`;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = `loading`;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = `succeeded`;
        state.data = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = `failed`;
        state.error = action.payload;
      })
      .addCase(fetchServiceCategories.fulfilled, (state, action) => {
        state.serviceCategories = action.payload;
      })
      .addCase(updateService.pending, (state) => {
        state.updateFormStatus = `loading`;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.updateFormStatus = `succeeded`;
        state.updateFormData = action.payload;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.updateFormStatus = `failed`;
        state.updateFormErrors = action.payload;
      })
      .addCase(deleteService.pending, (state) => {
        state.deleteServiceStatus = `loading`;
        state.deleteServiceErrors = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.deleteServiceStatus = `succeeded`;
        state.deleteServiceData = action.payload;
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.deleteServiceStatus = `failed`;
        state.deleteServiceErrors = action.payload;
      })
  }
});

export const { 
  cleanError, 
  cleanErrors,
  resetUpdateFormStatus,
  resetDeleteServiceStatus,
} = servicesSlice.actions;
export default servicesSlice.reducer;