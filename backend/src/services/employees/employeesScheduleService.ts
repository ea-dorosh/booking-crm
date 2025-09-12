import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';

export interface EmployeeSchedulePeriodRow extends RowDataPacket {
  id: number;
  employee_id: number;
  valid_from: string; // DATE
  valid_until: string | null; // DATE or null
  repeat_cycle: number; // 1..4
}

export interface EmployeePeriodScheduleRow extends RowDataPacket {
  id: number;
  period_id: number;
  week_number_in_cycle: number; // 1..4
  day_id: number; // 0..6
  start_time: Time_HH_MM_SS_Type; // UTC
  end_time: Time_HH_MM_SS_Type;   // UTC
  block_start_time_1: Time_HH_MM_SS_Type | null;
  block_end_time_1: Time_HH_MM_SS_Type | null;
}

// CamelCase DTOs returned to API
export interface EmployeeSchedulePeriodDto {
  id: number;
  employeeId: number;
  validFrom: string;
  validUntil: string | null;
  repeatCycle: number;
  createdAt: string;
  updatedAt: string;
  canDelete: boolean;
}

export interface EmployeePeriodScheduleDto {
  id: number;
  periodId: number;
  weekNumberInCycle: number;
  dayId: number;
  startTime: Time_HH_MM_SS_Type;
  endTime: Time_HH_MM_SS_Type;
  blockStartTimeFirst: Time_HH_MM_SS_Type | null;
  blockEndTimeFirst: Time_HH_MM_SS_Type | null;
}

export interface CreatePeriodData {
  validFrom: Date_ISO_Type; // must be Monday
  validUntil?: Date_ISO_Type | null;
  repeatCycle: 1 | 2 | 3 | 4;
}

export interface UpdatePeriodDatesData {
  validFrom: Date_ISO_Type; // must be Monday
  validUntil?: Date_ISO_Type | null;
}

export interface WorkingTimesForDateResult {
  date: Date_ISO_Type;
  employeeId: number;
  startTime: Time_HH_MM_SS_Type | null; // UTC
  endTime: Time_HH_MM_SS_Type | null;   // UTC
  blockStartTimeFirst: Time_HH_MM_SS_Type | null;
  blockEndTimeFirst: Time_HH_MM_SS_Type | null;
}

// Monday enforcement disabled: periods can start from any calendar day

async function validateNoPeriodOverlap(
  dbPool: Pool,
  employeeId: number,
  validFrom: Date_ISO_Type,
  validUntil: Date_ISO_Type | null,
  excludePeriodId?: number,
): Promise<void> {
  const sql = `
    SELECT id, valid_from, valid_until
    FROM EmployeeSchedulePeriods
    WHERE employee_id = ?
      AND (? IS NULL OR id <> ?)
      AND NOT (COALESCE(valid_until, '9999-12-31') < ? OR valid_from > ?)
    LIMIT 1
  `;

  const [rows] = await dbPool.query<EmployeeSchedulePeriodRow[]>(sql, [
    employeeId,
    excludePeriodId ?? null,
    excludePeriodId ?? null,
    validFrom,
    validUntil ?? `9999-12-31`,
  ]);

  if (rows.length > 0) {
    const error: any = new Error(`Schedule period overlaps with existing period`);
    error.statusCode = 409;
    throw error;
  }
}

async function createEmployeePeriod(
  dbPool: Pool,
  employeeId: number,
  data: CreatePeriodData,
): Promise<number> {
  // Allow any calendar day as a start of the period
  if (data.validUntil && dayjs.utc(data.validFrom).isAfter(dayjs.utc(data.validUntil))) {
    const error: any = new Error(`valid_from must be before or equal to valid_until`);
    error.statusCode = 400;
    throw error;
  }

  await validateNoPeriodOverlap(dbPool, employeeId, data.validFrom, data.validUntil ?? null);

  const insertSql = `
    INSERT INTO EmployeeSchedulePeriods (employee_id, valid_from, valid_until, repeat_cycle)
    VALUES (?, ?, ?, ?)
  `;
  const [res] = await dbPool.query<ResultSetHeader>(insertSql, [
    employeeId,
    data.validFrom,
    data.validUntil ?? null,
    data.repeatCycle,
  ]);
  return res.insertId;
}

async function updatePeriodDates(
  dbPool: Pool,
  periodId: number,
  data: UpdatePeriodDatesData,
): Promise<void> {
  // Allow any calendar day as a start of the period
  if (data.validUntil && dayjs.utc(data.validFrom).isAfter(dayjs.utc(data.validUntil))) {
    const error: any = new Error(`valid_from must be before or equal to valid_until`);
    error.statusCode = 400;
    throw error;
  }

  // Find employee for this period
  const [rows] = await dbPool.query<EmployeeSchedulePeriodRow[]>(
    `SELECT employee_id FROM EmployeeSchedulePeriods WHERE id = ?`, [periodId],
  );
  if (rows.length === 0) {
    const error: any = new Error(`Schedule period not found`);
    error.statusCode = 404;
    throw error;
  }
  const employeeId = rows[0].employee_id;

  await validateNoPeriodOverlap(dbPool, employeeId, data.validFrom, data.validUntil ?? null, periodId);

  await dbPool.query(`
    UPDATE EmployeeSchedulePeriods
    SET valid_from = ?, valid_until = ?, updated_at = NOW()
    WHERE id = ?
  `, [data.validFrom, data.validUntil ?? null, periodId]);
}

async function updatePeriodRepeatCycle(
  dbPool: Pool,
  periodId: number,
  repeatCycle: 1 | 2 | 3 | 4,
): Promise<void> {
  // Check if there are schedule rows with week_number_in_cycle > repeatCycle
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM EmployeePeriodSchedule WHERE period_id = ? AND week_number_in_cycle > ?`,
    [periodId, repeatCycle],
  );
  const cnt = Number((rows[0] as any)?.cnt || 0);
  if (cnt > 0) {
    const error: any = new Error(`Existing week numbers exceed new repeat_cycle`);
    error.statusCode = 400;
    throw error;
  }

  await dbPool.query(`
    UPDATE EmployeeSchedulePeriods SET repeat_cycle = ?, updated_at = NOW() WHERE id = ?
  `, [repeatCycle, periodId]);
}

async function getEmployeeActivePeriod(
  dbPool: Pool,
  employeeId: number,
  date: Date_ISO_Type,
): Promise<EmployeeSchedulePeriodDto | null> {
  const sql = `
    SELECT
      id,
      employee_id,
      DATE_FORMAT(valid_from, '%Y-%m-%d') AS valid_from,
      CASE WHEN valid_until IS NULL THEN NULL ELSE DATE_FORMAT(valid_until, '%Y-%m-%d') END AS valid_until,
      repeat_cycle,
      created_at,
      updated_at
    FROM EmployeeSchedulePeriods
    WHERE employee_id = ?
      AND valid_from <= ?
      AND (valid_until IS NULL OR valid_until >= ?)
    ORDER BY valid_from DESC
    LIMIT 1
  `;
  const [rows] = await dbPool.query<EmployeeSchedulePeriodRow[]>(sql, [employeeId, date, date]);
  const row = rows[0];
  if (!row) return null;
  const todayIso = dayjs.utc().format(`YYYY-MM-DD`);
  const startsInFuture = dayjs.utc(row.valid_from).isAfter(dayjs.utc(todayIso));
  const isOpenEnded = row.valid_until === null;
  const isActiveToday = dayjs.utc(row.valid_from).isSameOrBefore(dayjs.utc(todayIso))
    && (row.valid_until === null || dayjs.utc(row.valid_until).isSameOrAfter(dayjs.utc(todayIso)));
  const endsBeforeToday = row.valid_until !== null && dayjs.utc(row.valid_until).isBefore(dayjs.utc(todayIso));
  return {
    id: row.id,
    employeeId: row.employee_id,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    repeatCycle: row.repeat_cycle,
    createdAt: (row as any).created_at,
    updatedAt: (row as any).updated_at,
    canDelete: !isOpenEnded && startsInFuture && !isActiveToday && !endsBeforeToday,
  };
}

async function getEmployeePeriods(
  dbPool: Pool,
  employeeId: number,
): Promise<EmployeeSchedulePeriodDto[]> {
  const sql = `
    SELECT
      id,
      employee_id,
      DATE_FORMAT(valid_from, '%Y-%m-%d') AS valid_from,
      CASE WHEN valid_until IS NULL THEN NULL ELSE DATE_FORMAT(valid_until, '%Y-%m-%d') END AS valid_until,
      repeat_cycle,
      created_at,
      updated_at
    FROM EmployeeSchedulePeriods
    WHERE employee_id = ?
    ORDER BY valid_from ASC
  `;
  const [rows] = await dbPool.query<EmployeeSchedulePeriodRow[]>(sql, [employeeId]);
  const todayIso = dayjs.utc().format(`YYYY-MM-DD`);
  return rows.map((row) => {
    const startsInFuture = dayjs.utc(row.valid_from).isAfter(dayjs.utc(todayIso));
    const isOpenEnded = row.valid_until === null;
    const isActiveToday = dayjs.utc(row.valid_from).isSameOrBefore(dayjs.utc(todayIso))
      && (row.valid_until === null || dayjs.utc(row.valid_until).isSameOrAfter(dayjs.utc(todayIso)));
    const endsBeforeToday = row.valid_until !== null && dayjs.utc(row.valid_until).isBefore(dayjs.utc(todayIso));
    return {
      id: row.id,
      employeeId: row.employee_id,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      repeatCycle: row.repeat_cycle,
      createdAt: (row as any).created_at,
      updatedAt: (row as any).updated_at,
      canDelete: !isOpenEnded && startsInFuture && !isActiveToday && !endsBeforeToday,
    };
  });
}

async function getPeriodScheduleRows(
  dbPool: Pool,
  periodId: number,
): Promise<EmployeePeriodScheduleDto[]> {
  const sql = `
    SELECT *
    FROM EmployeePeriodSchedule
    WHERE period_id = ?
    ORDER BY week_number_in_cycle ASC, day_id ASC
  `;
  const [rows] = await dbPool.query<EmployeePeriodScheduleRow[]>(sql, [periodId]);
  return rows.map((row) => ({
    id: row.id,
    periodId: row.period_id,
    weekNumberInCycle: row.week_number_in_cycle,
    dayId: row.day_id,
    startTime: row.start_time,
    endTime: row.end_time,
    blockStartTimeFirst: row.block_start_time_1,
    blockEndTimeFirst: row.block_end_time_1,
  }));
}

function getWeekNumberInCycle(periodStartIso: Date_ISO_Type, dateIso: Date_ISO_Type, repeatCycle: number): number {
  const start = dayjs.utc(periodStartIso).startOf(`day`);
  const d = dayjs.utc(dateIso).startOf(`day`);
  const weeksPassed = Math.floor(d.diff(start, `day`) / 7);
  return (weeksPassed % repeatCycle) + 1;
}

async function getEmployeeWorkingTimes(
  dbPool: Pool,
  employeeId: number,
  date: Date_ISO_Type,
): Promise<WorkingTimesForDateResult> {
  const active = await getEmployeeActivePeriod(dbPool, employeeId, date);
  if (!active) {
    return {
      date,
      employeeId,
      startTime: null,
      endTime: null,
      blockStartTimeFirst: null,
      blockEndTimeFirst: null,
    };
  }

  const weekNumber = getWeekNumberInCycle(active.validFrom as Date_ISO_Type, date, active.repeatCycle);
  const dayId = dayjs.utc(date).day(); // 0..6 Sun..Sat

  const [rows] = await dbPool.query<EmployeePeriodScheduleRow[]>(
    `SELECT * FROM EmployeePeriodSchedule WHERE period_id = ? AND week_number_in_cycle = ? AND day_id = ?`,
    [active.id, weekNumber, dayId],
  );

  if (rows.length === 0) {
    // Treat as non-working day (configuration allows empty week days)
    return {
      date,
      employeeId,
      startTime: null,
      endTime: null,
      blockStartTimeFirst: null,
      blockEndTimeFirst: null,
    };
  }

  const row = rows[0];
  return {
    date,
    employeeId,
    startTime: row.start_time,
    endTime: row.end_time,
    blockStartTimeFirst: row.block_start_time_1,
    blockEndTimeFirst: row.block_end_time_1,
  };
}

async function upsertEmployeePeriodDay(
  dbPool: Pool,
  periodId: number,
  weekNumberInCycle: number,
  dayId: number,
  startTime: Time_HH_MM_SS_Type,
  endTime: Time_HH_MM_SS_Type,
  blockStartTimeFirst?: Time_HH_MM_SS_Type | null,
  blockEndTimeFirst?: Time_HH_MM_SS_Type | null,
): Promise<void> {
  // Validate week number against period.repeat_cycle
  const [periodRows] = await dbPool.query<EmployeeSchedulePeriodRow[]>(
    `SELECT repeat_cycle FROM EmployeeSchedulePeriods WHERE id = ?`, [periodId],
  );
  if (periodRows.length === 0) {
    const error: any = new Error(`Schedule period not found`);
    error.statusCode = 404;
    throw error;
  }
  const repeatCycle = periodRows[0].repeat_cycle;
  if (weekNumberInCycle < 1 || weekNumberInCycle > repeatCycle) {
    const error: any = new Error(`week_number_in_cycle must be between 1 and ${repeatCycle}`);
    error.statusCode = 400;
    throw error;
  }

  // Defensive cleanup: ensure there is a single row per (period, week, day)
  await dbPool.query(
    `DELETE FROM EmployeePeriodSchedule WHERE period_id = ? AND week_number_in_cycle = ? AND day_id = ?`,
    [periodId, weekNumberInCycle, dayId],
  );

  const sql = `
    INSERT INTO EmployeePeriodSchedule (period_id, week_number_in_cycle, day_id, start_time, end_time, block_start_time_1, block_end_time_1)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await dbPool.query<ResultSetHeader>(sql, [
    periodId,
    weekNumberInCycle,
    dayId,
    startTime,
    endTime,
    blockStartTimeFirst ?? null,
    blockEndTimeFirst ?? null,
  ]);
}

export {
  createEmployeePeriod,
  updatePeriodDates,
  getEmployeeActivePeriod,
  getEmployeePeriods,
  getPeriodScheduleRows,
  getEmployeeWorkingTimes,
  validateNoPeriodOverlap,
  upsertEmployeePeriodDay,
  updatePeriodRepeatCycle,
};

export async function deleteEmployeePeriodDay(
  dbPool: Pool,
  periodId: number,
  weekNumberInCycle: number,
  dayId: number,
): Promise<void> {
  await dbPool.query(
    `DELETE FROM EmployeePeriodSchedule WHERE period_id = ? AND week_number_in_cycle = ? AND day_id = ?`,
    [periodId, weekNumberInCycle, dayId],
  );
}

export async function deleteEmployeePeriod(
  dbPool: Pool,
  periodId: number,
): Promise<void> {
  // Load period
  const [rows] = await dbPool.query<EmployeeSchedulePeriodRow[]>(
    `SELECT id, valid_from, valid_until FROM EmployeeSchedulePeriods WHERE id = ?`,
    [periodId],
  );
  if (rows.length === 0) {
    const error: any = new Error(`Schedule period not found`);
    error.statusCode = 404;
    throw error;
  }

  const period = rows[0];
  const todayIso = dayjs.utc().format(`YYYY-MM-DD`);

  // Business rules:
  // - Cannot delete past periods (valid_until < today)
  // - Cannot delete current active period (valid_from <= today <= valid_until or valid_until IS NULL)
  // - Cannot delete open-ended periods (valid_until IS NULL)
  // - Only future periods (valid_from > today AND valid_until IS NOT NULL) are deletable

  if (period.valid_until === null) {
    const error: any = new Error(`Cannot delete open-ended period`);
    error.statusCode = 400;
    throw error;
  }

  const startsInFuture = dayjs.utc(period.valid_from).isAfter(dayjs.utc(todayIso));
  const endsBeforeToday = dayjs.utc(period.valid_until).isBefore(dayjs.utc(todayIso));
  const isActiveToday = dayjs.utc(period.valid_from).isSameOrBefore(dayjs.utc(todayIso))
    && dayjs.utc(period.valid_until).isSameOrAfter(dayjs.utc(todayIso));

  if (endsBeforeToday) {
    const error: any = new Error(`Cannot delete past period`);
    error.statusCode = 400;
    throw error;
  }

  if (isActiveToday) {
    const error: any = new Error(`Cannot delete active period`);
    error.statusCode = 400;
    throw error;
  }

  if (!startsInFuture) {
    const error: any = new Error(`Only future periods can be deleted`);
    error.statusCode = 400;
    throw error;
  }

  // Cascade delete: first delete schedule rows, then the period
  await dbPool.query(`DELETE FROM EmployeePeriodSchedule WHERE period_id = ?`, [periodId]);
  await dbPool.query(`DELETE FROM EmployeeSchedulePeriods WHERE id = ?`, [periodId]);
}


