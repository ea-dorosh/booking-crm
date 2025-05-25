import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import servicesService from "@/services/services.service";

export const fetchServiceCategories = createAsyncThunk(
  `serviceCategories/fetchServiceCategories`,
  async (_arg, thunkAPI) => {
    try {
      const data = await servicesService.getServiceCategories();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
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
      const parsedErrors = await JSON.parse(error.message);
      return thunkAPI.rejectWithValue(parsedErrors);
    }
  }
);

export const deleteService = createAsyncThunk(
  `serviceCategories/deleteCategory`,
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
        state.isUpdateCategoryRequestPending = true;
        state.updateFormErrors = action.payload;
      })
  }
});

export const {
  cleanError,
  cleanErrors,
} = serviceCategoriesSlice.actions;

export default serviceCategoriesSlice.reducer;
