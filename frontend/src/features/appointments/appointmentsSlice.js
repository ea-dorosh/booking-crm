import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import {
  APPOINTMENTS_SORT_RULE,
  SORT_DIRECTION,
} from '@/constants/sorting';
import { appointmentStatusEnum  } from '@/enums/enums';
import appointmentsService from "@/services/appointments.service";

// SessionStorage key for filters
const APPOINTMENTS_FILTERS_KEY = `appointmentsFilters`;

// Helper functions for sessionStorage
const saveFiltersToStorage = (filters) => {
  try {
    sessionStorage.setItem(APPOINTMENTS_FILTERS_KEY, JSON.stringify(filters));
  } catch (error) {
    console.warn(`Failed to save appointment filters to sessionStorage:`, error);
  }
};

const loadFiltersFromStorage = () => {
  try {
    const savedFilters = sessionStorage.getItem(APPOINTMENTS_FILTERS_KEY);
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
  } catch (error) {
    console.warn(`Failed to load appointment filters from sessionStorage:`, error);
  }
  return null;
};

export const fetchAppointments = createAsyncThunk(
  `appointments/fetchAppointments`,
  async (_arg, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const {
        startDate, status, sortRule, sortDirection,
      } = state.appointments;

      const data = await appointmentsService.getAppointments(
        startDate,
        status,
        sortRule,
        sortDirection,
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Load initial state from sessionStorage or use defaults
const getInitialState = () => {
  const savedFilters = loadFiltersFromStorage();
  const defaultState = {
    data: null,
    isPending: false,
    error: null,
    sortRule: APPOINTMENTS_SORT_RULE.DATE,
    sortDirection: SORT_DIRECTION.ASC,
    startDate: null,
    status: appointmentStatusEnum.active,
  };

  if (savedFilters) {
    return {
      ...defaultState,
      sortRule: savedFilters.sortRule || defaultState.sortRule,
      sortDirection: savedFilters.sortDirection || defaultState.sortDirection,
      startDate: savedFilters.startDate || defaultState.startDate,
      status: savedFilters.status !== undefined ? savedFilters.status : defaultState.status,
    };
  }

  return defaultState;
};

const appointmentsSlice = createSlice({
  name: `appointments`,
  initialState: getInitialState(),
  reducers: {
    resetAppointmentsData: (state) => {
      state.data = null;
    },
    setSortingRule: (state, action) => {
      state.sortRule = action.payload.sortRule;
      state.sortDirection = action.payload.sortDirection;

      // Save filters to sessionStorage
      saveFiltersToStorage({
        sortRule: state.sortRule,
        sortDirection: state.sortDirection,
        startDate: state.startDate,
        status: state.status,
      });
    },
    setStartDate: (state, action) => {
      state.startDate = action.payload.startDate;

      // Save filters to sessionStorage
      saveFiltersToStorage({
        sortRule: state.sortRule,
        sortDirection: state.sortDirection,
        startDate: state.startDate,
        status: state.status,
      });
    },
    setStatus: (state, action) => {
      state.status = action.payload.status;

      // Save filters to sessionStorage
      saveFiltersToStorage({
        sortRule: state.sortRule,
        sortDirection: state.sortDirection,
        startDate: state.startDate,
        status: state.status,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.isPending = true;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isPending = false;
        state.data = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isPending = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSortingRule,
  setStartDate,
  setStatus,
  resetAppointmentsData,
} = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
