import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { serviceStatusEnum } from '@/enums/enums'
import servicesService from "@/services/services.service";

export const fetchServices = createAsyncThunk(
  `services/fetchServices`,
  async (statuses, thunkAPI) => {
    try {
      let statusesToFetch = statuses;
      if (statuses?.[0] === `all`) {
        statusesToFetch = [
          serviceStatusEnum.active,
          serviceStatusEnum.archived,
          serviceStatusEnum.disabled,
        ];
      }

      const data = await servicesService.getServices(statusesToFetch);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
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
  },
);

export const updateServiceStatus = createAsyncThunk(
  `services/updateServiceStatus`,
  async ({
    serviceId, status,
  }, thunkAPI) => {
    try {
      await servicesService.updateServiceStatus(serviceId, status);
      return {
        serviceId,
        status,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
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
    selectedEmployees: JSON.parse(sessionStorage.getItem(`services-employee-filter`) || `[]`),
    selectedCategories: JSON.parse(sessionStorage.getItem(`services-category-filter`) || `[]`),
    selectedSubCategories: JSON.parse(sessionStorage.getItem(`services-subcategory-filter`) || `[]`),
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
    setSelectedEmployees: (state, action) => {
      state.selectedEmployees = action.payload;
      sessionStorage.setItem(`services-employee-filter`, JSON.stringify(action.payload));
    },
    toggleEmployeeFilter: (state, action) => {
      const employeeId = action.payload;
      const currentSelection = state.selectedEmployees;

      if (currentSelection.includes(employeeId)) {
        state.selectedEmployees = currentSelection.filter(id => id !== employeeId);
      } else {
        state.selectedEmployees = [...currentSelection, employeeId];
      }

      sessionStorage.setItem(`services-employee-filter`, JSON.stringify(state.selectedEmployees));
    },
    clearEmployeeFilter: (state) => {
      state.selectedEmployees = [];
      sessionStorage.removeItem(`services-employee-filter`);
    },
    toggleCategoryFilter: (state, action) => {
      const categoryId = action.payload;
      const currentSelection = state.selectedCategories;

      if (currentSelection.includes(categoryId)) {
        state.selectedCategories = currentSelection.filter(id => id !== categoryId);
      } else {
        state.selectedCategories = [...currentSelection, categoryId];
      }

      sessionStorage.setItem(`services-category-filter`, JSON.stringify(state.selectedCategories));
    },
    toggleSubCategoryFilter: (state, action) => {
      const subCategoryId = action.payload;
      const currentSelection = state.selectedSubCategories;

      if (currentSelection.includes(subCategoryId)) {
        state.selectedSubCategories = currentSelection.filter(id => id !== subCategoryId);
      } else {
        state.selectedSubCategories = [...currentSelection, subCategoryId];
      }

      sessionStorage.setItem(`services-subcategory-filter`, JSON.stringify(state.selectedSubCategories));
    },
    clearServicesFilters: (state) => {
      state.selectedEmployees = [];
      state.selectedCategories = [];
      state.selectedSubCategories = [];
      sessionStorage.removeItem(`services-employee-filter`);
      sessionStorage.removeItem(`services-category-filter`);
      sessionStorage.removeItem(`services-subcategory-filter`);
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
      .addCase(updateServiceStatus.pending, (state) => {
        state.isUpdateServiceRequestPending = true;
      })
      .addCase(updateServiceStatus.fulfilled, (state, action) => {
        state.isUpdateServiceRequestPending = false;
        // Update the service status in the current data
        if (state.data) {
          const service = state.data.find(s => s.id === action.payload.serviceId);
          if (service) {
            service.status = action.payload.status;
          }
        }
      })
      .addCase(updateServiceStatus.rejected, (state, action) => {
        state.isUpdateServiceRequestPending = false;
        state.error = action.payload;
      })
  },
});

export const {
  cleanError,
  cleanErrors,
  setSelectedEmployees,
  toggleEmployeeFilter,
  clearEmployeeFilter,
  toggleCategoryFilter,
  toggleSubCategoryFilter,
  clearServicesFilters,
} = servicesSlice.actions;
export default servicesSlice.reducer;
