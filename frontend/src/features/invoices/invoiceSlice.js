import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { unset } from 'lodash';
import invoicesService from "@/services/invoices.service";

export const fetchInvoice = createAsyncThunk(
  `invoice/fetchInvoice`,
  async (id, thunkAPI) => {
    try {
      const data = await invoicesService.getInvoiceById(id);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

export const updateInvoice = createAsyncThunk(
  `invoice/updateInvoice`,
  async (formData, thunkAPI) => {
    try {
      if (formData.id !== undefined) {
        const response = await invoicesService.updateCustomer(formData);
        return response;
      } else {
        const response = await invoicesService.createInvoice(formData);
        return response;
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

export const downloadInvoicePdf = createAsyncThunk(
  `invoice/downloadInvoicePdf`,
  async (id, thunkAPI) => {
    try {
      const pdfBlob = await invoicesService.downloadInvoicePdf(id);
      return pdfBlob;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

const invoiceSlice = createSlice({
  name: `invoice`,
  initialState: {
    data: null,
    isPending: false,
    error: null,
    updateFormData: null,
    updateFormPending: false,
    updateFormErrors: null,
    downloadInvoicePdfPending: false,
    downloadInvoicePdfError: null,
  },
  reducers: {
    cleanError: (state, action) => {
      const fieldName = action.payload;

      unset(state.updateFormErrors.validationErrors, fieldName);

      state.updateFormErrors.validationErrors = removeEmptyRecursivelyKeepArray(state.updateFormErrors.validationErrors);
    },
    removeServiceErrorIndex: (state, action) => {
      const index = action.payload;

      if (state.updateFormErrors?.validationErrors) {
        if (
          state.updateFormErrors?.validationErrors?.services &&
          Array.isArray(state.updateFormErrors.validationErrors.services)
        ) {
          state.updateFormErrors.validationErrors.services.splice(index, 1);
        }

        state.updateFormErrors.validationErrors = removeEmptyRecursivelyKeepArray(
          state.updateFormErrors.validationErrors,
        );
      }
    },
    cleanErrors: (state) => {
      state.updateFormErrors = null;
    },
    resetInvoiceData: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoice.pending, (state) => {
        state.data = null;
        state.isPending = true;
      })
      .addCase(fetchInvoice.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = action.payload;
      })
      .addCase(fetchInvoice.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      })
      .addCase(updateInvoice.pending, (state) => {
        state.updateFormData = null;
        state.updateFormPending = true;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.updateFormPending = false;
        state.updateFormData = action.payload.data;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.updateFormPending = false;
        state.updateFormErrors = action.payload;
      })
      .addCase(downloadInvoicePdf.pending, (state) => {
        state.downloadInvoicePdfError = null;
        state.downloadInvoicePdfPending = true;
      })
      .addCase(downloadInvoicePdf.fulfilled, (state) => {
        state.downloadInvoicePdfPending = false;
      })
      .addCase(downloadInvoicePdf.rejected, (state, action) => {
        state.downloadInvoicePdfPending = false;
        state.downloadInvoicePdfError = action.payload;
      })
  },
});

export const {
  cleanError,
  cleanErrors,
  removeServiceErrorIndex,
  resetInvoiceData,
} = invoiceSlice.actions;

function removeEmptyRecursivelyKeepArray(data) {
  if (Array.isArray(data)) {
    let hasNonEmptyItem = false;

    for (let i = 0; i < data.length; i++) {
      data[i] = removeEmptyRecursivelyKeepArray(data[i]);

      if (isEmpty(data[i])) {
        data[i] = {};
      } else {
        hasNonEmptyItem = true;
      }
    }

    return hasNonEmptyItem ? data : null;
  } else if (typeof data === `object` && data !== null) {
    Object.keys(data).forEach((key) => {
      const value = (data)[key];
      (data)[key] = removeEmptyRecursivelyKeepArray(value);

      if (isEmpty((data)[key])) {
        delete (data)[key];
      }
    });

    return Object.keys(data).length > 0 ? data : null;
  }

  return data;
}

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === `object`) {
    return Object.keys(value).length === 0;
  }
  return false;
}


export default invoiceSlice.reducer;