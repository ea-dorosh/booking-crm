import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import employeesService from '@/services/employees.service';

export const fetchEmployeeSchedulePeriods = createAsyncThunk(
  `employeeSchedulePeriods/fetchEmployeeSchedulePeriods`,
  async (employeeId, thunkAPI) => {
    try {
      const data = await employeesService.getEmployeeSchedulePeriods(employeeId);
      return data;
    } catch (error) {
      const msg = typeof error === `string` ? error : (error?.message || String(error));
      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const createSchedulePeriod = createAsyncThunk(
  `employeeSchedulePeriods/createSchedulePeriod`,
  async (
    {
      employeeId,
      body,
    },
    thunkAPI,
  ) => {
    try {
      const data = await employeesService.createEmployeeSchedulePeriod(employeeId, body);
      return data;
    } catch (error) {
      const msg = typeof error === `string` ? error : (error?.message || String(error));
      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const updateSchedulePeriodDates = createAsyncThunk(
  `employeeSchedulePeriods/updateSchedulePeriodDates`,
  async (
    {
      periodId,
      body,
    },
    thunkAPI,
  ) => {
    try {
      const data = await employeesService.updateEmployeeSchedulePeriodDates(periodId, body);
      return data;
    } catch (error) {
      const msg = typeof error === `string` ? error : (error?.message || String(error));
      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const upsertSchedulePeriodDay = createAsyncThunk(
  `employeeSchedulePeriods/upsertSchedulePeriodDay`,
  async (
    {
      periodId,
      weekNumber,
      dayId,
      body,
    },
    thunkAPI,
  ) => {
    try {
      const data = await employeesService.upsertEmployeePeriodDay(periodId, weekNumber, dayId, body);
      return data;
    } catch (error) {
      const msg = typeof error === `string` ? error : (error?.message || String(error));
      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const deleteSchedulePeriodDay = createAsyncThunk(
  `employeeSchedulePeriods/deleteSchedulePeriodDay`,
  async (
    {
      periodId,
      weekNumber,
      dayId,
    },
    thunkAPI,
  ) => {
    try {
      const data = await employeesService.deleteEmployeePeriodDay(periodId, weekNumber, dayId);
      return data;
    } catch (error) {
      const msg = typeof error === `string` ? error : (error?.message || String(error));
      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const fetchPeriodScheduleRows = createAsyncThunk(
  `employeeSchedulePeriods/fetchPeriodScheduleRows`,
  async (periodId, thunkAPI) => {
    try {
      const data = await employeesService.getPeriodScheduleRows(periodId);
      return {
        periodId,
        rows: data,
      };
    } catch (error) {
      const msg = typeof error === `string` ? error : (error?.message || String(error));
      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const updateRepeatCycleThunk = createAsyncThunk(
  `employeeSchedulePeriods/updateRepeatCycle`,
  async (
    {
      periodId,
      repeatCycle,
    },
    thunkAPI,
  ) => {
    try {
      await employeesService.updateRepeatCycle(periodId, repeatCycle);
      return {
        periodId,
        repeatCycle,
      };
    } catch (error) {
      const msg = typeof error === `string` ? error : (error?.message || String(error));
      return thunkAPI.rejectWithValue(msg);
    }
  },
);

export const deleteSchedulePeriod = createAsyncThunk(
  `employeeSchedulePeriods/deleteSchedulePeriod`,
  async (periodId, thunkAPI) => {
    try {
      await employeesService.deleteEmployeeSchedulePeriod(periodId);
      return periodId;
    } catch (error) {
      const msg = typeof error === `string` ? error : (error?.message || String(error));
      return thunkAPI.rejectWithValue(msg);
    }
  },
);

const employeeSchedulePeriodsSlice = createSlice({
  name: `employeeSchedulePeriods`,
  initialState: {
    periods: [],
    periodSchedules: {},
    status: `idle`,
    error: null,
    createStatus: `idle`,
    updateStatus: `idle`,
    upsertDayStatus: `idle`,
    deleteDayStatus: `idle`,
    deletePeriodStatus: `idle`,
  },
  reducers: {
    clearEmployeeSchedulePeriods: (state) => {
      state.periods = [];
      state.status = `idle`;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeSchedulePeriods.pending, (state) => {
        state.status = `loading`;
      })
      .addCase(fetchEmployeeSchedulePeriods.fulfilled, (state, action) => {
        state.status = `succeeded`;
        state.periods = action.payload || [];
      })
      .addCase(fetchEmployeeSchedulePeriods.rejected, (state, action) => {
        state.status = `failed`;
        state.error = action.payload;
      })
      .addCase(createSchedulePeriod.pending, (state) => {
        state.createStatus = `loading`;
      })
      .addCase(createSchedulePeriod.fulfilled, (state) => {
        state.createStatus = `succeeded`;
      })
      .addCase(createSchedulePeriod.rejected, (state, action) => {
        state.createStatus = `failed`;
        state.error = action.payload;
      })
      .addCase(updateSchedulePeriodDates.pending, (state) => {
        state.updateStatus = `loading`;
      })
      .addCase(updateSchedulePeriodDates.fulfilled, (state) => {
        state.updateStatus = `succeeded`;
      })
      .addCase(updateSchedulePeriodDates.rejected, (state, action) => {
        state.updateStatus = `failed`;
        state.error = action.payload;
      })
      .addCase(upsertSchedulePeriodDay.pending, (state) => {
        state.upsertDayStatus = `loading`;
      })
      .addCase(upsertSchedulePeriodDay.fulfilled, (state) => {
        state.upsertDayStatus = `succeeded`;
      })
      .addCase(upsertSchedulePeriodDay.rejected, (state, action) => {
        state.upsertDayStatus = `failed`;
        state.error = action.payload;
      })
      .addCase(deleteSchedulePeriodDay.pending, (state) => {
        state.deleteDayStatus = `loading`;
      })
      .addCase(deleteSchedulePeriodDay.fulfilled, (state) => {
        state.deleteDayStatus = `succeeded`;
      })
      .addCase(deleteSchedulePeriodDay.rejected, (state, action) => {
        state.deleteDayStatus = `failed`;
        state.error = action.payload;
      })
      .addCase(fetchPeriodScheduleRows.pending, (state) => {
        state.status = `loading`;
      })
      .addCase(fetchPeriodScheduleRows.fulfilled, (state, action) => {
        state.status = `succeeded`;
        state.periodSchedules[action.payload.periodId] = action.payload.rows;
      })
      .addCase(fetchPeriodScheduleRows.rejected, (state, action) => {
        state.status = `failed`;
        state.error = action.payload;
      })
      .addCase(deleteSchedulePeriod.pending, (state) => {
        state.deletePeriodStatus = `loading`;
      })
      .addCase(deleteSchedulePeriod.fulfilled, (state, action) => {
        state.deletePeriodStatus = `succeeded`;
        const id = action.payload;
        state.periods = state.periods.filter(p => p.id !== id);
        delete state.periodSchedules[id];
      })
      .addCase(deleteSchedulePeriod.rejected, (state, action) => {
        state.deletePeriodStatus = `failed`;
        state.error = action.payload;
      })
      .addCase(updateRepeatCycleThunk.fulfilled, (state, action) => {
        const {
          periodId,
          repeatCycle,
        } = action.payload;
        const period = state.periods.find(p => p.id === periodId);
        if (period) period.repeatCycle = repeatCycle;
      });
  },
});

export const { clearEmployeeSchedulePeriods } = employeeSchedulePeriodsSlice.actions;
export default employeeSchedulePeriodsSlice.reducer;


