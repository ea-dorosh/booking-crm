import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import companyService from "@/services/company.service";

export const fetchCompany = createAsyncThunk(
  `company/fetchCompany`,
  async (_, thunkAPI) => {
    try {
      const data = await companyService.getCompany();

      return data;
    } catch (error) {
      console.dir(`error`, error);

      return thunkAPI.rejectWithValue(error);
    }
  },
);

export const updateCompany = createAsyncThunk(
  `company/updateCompany`,
  async (formData, thunkAPI) => {
    try {
      if (formData.id !== undefined) {
        const response = await companyService.updateCompany(formData);
        return response;
      } else {
        const response = await companyService.createCompany(formData);
        return response;
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const companySlice = createSlice({
  name: `company`,
  initialState: {
    data: null,
    isPending: false,
    error: null,
    updateFormData: null,
    updateFormPending: false,
    updateFormErrors: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    cleanError: (state, action) => {
      const fieldName = action.payload;

      if (state.updateFormErrors?.validationErrors[fieldName]) {
        delete state.updateFormErrors.validationErrors[fieldName];
      }
    },
    cleanErrors: (state) => {
      state.updateFormErrors = null;
    },
    resetCompanyData: (state) => {
      state.data = null;
      state.updateFormErrors = null;
      state.updateFormData = null;
      state.updateFormPending = false;
      state.error = null;
      state.isPending = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompany.pending, (state) => {
        state.data = null;
        state.isPending = true;
      })
      .addCase(fetchCompany.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = action.payload;
      })
      .addCase(fetchCompany.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      })
      .addCase(updateCompany.pending, (state) => {
        state.updateFormData = null;
        state.updateFormPending = true;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.updateFormPending = false;
        state.updateFormData = action.payload.data;
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.updateFormPending = false;
        state.updateFormErrors = action.payload;
      })
  },
});

export const {
  cleanError,
  cleanErrors,
  resetError,
  resetCompanyData,
} = companySlice.actions;

export default companySlice.reducer;
