import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { 
  CUSTOMERS_SORT_RULE,
  SORT_DIRECTION,
} from '@/constants/sorting';
import invoicesService from "@/services/invoices.service";

export const fetchInvoices = createAsyncThunk(
  `invoices/fetchInvoices`,
  async (_arg, thunkAPI) => {
    try {
      const data = await invoicesService.getInvoices();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const invoicesSlice = createSlice({
  name: `invoices`,
  initialState: {
    data: null,
    isPending: false,
    error: null,
    sortRule: CUSTOMERS_SORT_RULE.LAST_NAME,
    sortDirection: SORT_DIRECTION.ASC,
  },
  reducers: {
    resetInvoices: (state) => {
      state.data = null;
    },
    setSortingRule: (state, action) => {
      state.sortRule = action.payload.sortRule;
      state.sortDirection = action.payload.sortDirection;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.error = null;
        state.isPending = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      })
  }
});

export const { 
  resetInvoices, 
  setSortingRule,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;
