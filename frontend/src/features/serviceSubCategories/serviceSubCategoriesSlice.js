import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import servicesService from "@/services/services.service";

export const fetchServiceSubCategories = createAsyncThunk(
  `serviceSubCategories/fetchServiceSubCategories`,
  async (statuses, thunkAPI) => {
    try {
      const data = await servicesService.getServiceSubCategories(statuses);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateSubCategory = createAsyncThunk(
  `serviceSubCategories/updateSubCategory`,
  async (formData, thunkAPI) => {
    try {
      if (formData.id) {
        const { data } = await servicesService.updateServiceSubCategory(formData);

        return data;
      } else {
        const { data } = await servicesService.createServiceSubCategory(formData);

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
  `serviceSubCategories/deleteSubCategory`,
  async (serviceId, thunkAPI) => {
    try {
      const { data } = await servicesService.deleteService(serviceId);

      return data;
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

const serviceSubCategoriesSlice = createSlice({
  name: `serviceSubCategories`,
  initialState: {
    data: null,
    areSubCategoriesFetching: false,
    error: null,
    isUpdateSubCategoryRequestPending: false,
    updateFormData: null,
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceSubCategories.pending, (state) => {
        state.areSubCategoriesFetching = true;
      })
      .addCase(fetchServiceSubCategories.fulfilled, (state, action) => {
        state.areSubCategoriesFetching = false;
        state.data = action.payload;
      })
      .addCase(fetchServiceSubCategories.rejected, (state, action) => {
        state.areSubCategoriesFetching = false;
        state.error = action.payload;
      })
      .addCase(updateSubCategory.pending, (state) => {
        state.isUpdateSubCategoryRequestPending = true;
      })
      .addCase(updateSubCategory.fulfilled, (state, action) => {
        state.isUpdateSubCategoryRequestPending = false;
        state.updateFormData = action.payload;
      })
      .addCase(updateSubCategory.rejected, (state, action) => {
        state.isUpdateSubCategoryRequestPending = false;
        state.updateFormErrors = action.payload;
      })
  }
});

export const {
  cleanError,
  cleanErrors,
} = serviceSubCategoriesSlice.actions;

export default serviceSubCategoriesSlice.reducer;
