import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import servicesService from "@/services/services.service";

export const fetchServiceCategories = createAsyncThunk(
  `serviceCategories/fetchServiceCategories`,
  async (thunkAPI) => {
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
        await servicesService.updateServiceCategory(formData);
      } else {
        const { data } = await servicesService.createServiceCategory(formData);

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

const serviceCategoriesSlice = createSlice({
  name: `services`,
  initialState: {
    data: null,
    loading: false,
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
      .addCase(fetchServiceCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchServiceCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchServiceCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
  }
});

export const { 
  cleanError, 
  cleanErrors,
  resetUpdateFormStatus,
  resetDeleteServiceStatus,
} = serviceCategoriesSlice.actions;
export default serviceCategoriesSlice.reducer;