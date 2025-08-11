import { 
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { 
  CUSTOMERS_SORT_RULE,
  SORT_DIRECTION,
} from '@/constants/sorting';
import customersService from "@/services/customers.service";

export const fetchCustomers = createAsyncThunk(
  `customers/fetchCustomers`,
  async (_arg, thunkAPI) => {
    try {
      const data = await customersService.getCustomers();

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

const customersSlice = createSlice({
  name: `customers`,
  initialState: {
    data: null,
    isPending: false,
    error: null,
    sortRule: CUSTOMERS_SORT_RULE.LAST_NAME,
    sortDirection: SORT_DIRECTION.ASC,
  },
  reducers: {
    resetCustomers: (state) => {
      state.data = null;
    },
    setSortingRule: (state, action) => {
      state.sortRule = action.payload.sortRule;
      state.sortDirection = action.payload.sortDirection;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.isPending = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      })
  },
});

export const { 
  resetCustomers, 
  setSortingRule,
} = customersSlice.actions;
export default customersSlice.reducer;
