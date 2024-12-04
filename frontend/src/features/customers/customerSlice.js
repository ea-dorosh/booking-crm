import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import customersService from "@/services/customers.service";

export const fetchCustomer = createAsyncThunk(
  `customer/fetchCustomer`,
  async (id, thunkAPI) => {
    try {
      const data = await customersService.getCustomer(id);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateCustomer = createAsyncThunk(
  `customer/updateCustomer`,
  async (formData, thunkAPI) => {    
    try {
      if (formData.id !== undefined) {
        const response = await customersService.updateCustomer(formData);
        return response;
      } else {
        const response = await customersService.createCustomer(formData);
        return response;
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const servicesSlice = createSlice({
  name: `customer`,
  initialState: {
    data: null,
    isPending: false,
    error: null,
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
    resetCustomerData: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomer.pending, (state) => {
        state.data = null;
        state.isPending = true;
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = action.payload;
      })
      .addCase(fetchCustomer.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      })
      .addCase(updateCustomer.pending, (state) => {
        state.updateFormData = null;
        state.updateFormPending = true;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.updateFormPending = false; 
        state.updateFormData = action.payload.data;      
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.updateFormPending = false;
        state.updateFormErrors = action.payload;
      })
  }
});

export const { 
  cleanError, 
  cleanErrors,
  resetCustomerData
} = servicesSlice.actions;
export default servicesSlice.reducer;