import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import companyService from "@/services/company.service";

export const updateCompanyBranch = createAsyncThunk(
  `companyBranch/updateCompanyBranch`,
  async (formData, thunkAPI) => {
    try {
      if (formData.id !== undefined) {
        const response = await companyService.updateCompanyBranch(formData);
        return response;
      } else {
        const response = await companyService.createCompanyBranch(formData);
        return response;
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const companyBranchSlice = createSlice({
  name: `companyBranch`,
  initialState: {
    updateFormData: null,
    updateFormPending: false,
    updateFormErrors: null,
  },
  reducers: {
    cleanError: (state, action) => {
      const fieldName = action.payload;

      if (state.updateFormErrors?.validationErrors[fieldName]) {
        delete state.updateFormErrors.validationErrors[fieldName];
      }
    },
    cleanErrors: (state) => {
      state.updateFormErrors = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateCompanyBranch.pending, (state) => {
        state.updateFormData = null;
        state.updateFormPending = true;
      })
      .addCase(updateCompanyBranch.fulfilled, (state, action) => {
        state.updateFormPending = false;
        state.updateFormData = action.payload.data;
      })
      .addCase(updateCompanyBranch.rejected, (state, action) => {
        state.updateFormPending = false;
        state.updateFormErrors = action.payload;
      })
  },
});

export const {
  cleanError,
  cleanErrors,
} = companyBranchSlice.actions;

export default companyBranchSlice.reducer;
