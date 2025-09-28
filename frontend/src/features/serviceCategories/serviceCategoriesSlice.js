import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import servicesService from "@/services/services.service";

export const fetchServiceCategories = createAsyncThunk(
  `serviceCategories/fetchServiceCategories`,
  async (_, thunkAPI) => {
    try {
      // Always fetch all categories - filtering will be done on frontend
      const data = await servicesService.getServiceCategories();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const updateCategory = createAsyncThunk(
  `serviceCategories/updateCategory`,
  async (formData, thunkAPI) => {
    try {
      if (formData.id) {
        const { data } = await servicesService.updateServiceCategory(formData);

        return data;
      } else {
        const { data } = await servicesService.createServiceCategory(formData);

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
  },
);

const serviceCategoriesSlice = createSlice({
  name: `serviceCategories`,
  initialState: {
    data: null,
    areCategoriesFetching: false,
    error: null,
    isUpdateCategoryRequestPending: false,
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
      .addCase(fetchServiceCategories.pending, (state) => {
        state.areCategoriesFetching = true;
      })
      .addCase(fetchServiceCategories.fulfilled, (state, action) => {
        state.areCategoriesFetching = false;
        state.data = action.payload;
      })
      .addCase(fetchServiceCategories.rejected, (state, action) => {
        state.areCategoriesFetching = false;
        state.error = action.payload;
      })
      .addCase(updateCategory.pending, (state) => {
        state.isUpdateCategoryRequestPending = true;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isUpdateCategoryRequestPending = false;
        state.updateFormData = action.payload;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isUpdateCategoryRequestPending = false;
        state.updateFormErrors = action.payload;
      })
  },
});

export const {
  cleanError,
  cleanErrors,
} = serviceCategoriesSlice.actions;

export default serviceCategoriesSlice.reducer;
