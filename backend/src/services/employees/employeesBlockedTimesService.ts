import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';

interface EmployeeBlockedTimeRow extends RowDataPacket {
  id: number;
  employee_id: number;
  blocked_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeBlockedTimeData {
  id: number;
  employeeId: number;
  blockedDate: Date_ISO_Type;
  startTime: Time_HH_MM_SS_Type | null;
  endTime: Time_HH_MM_SS_Type | null;
  isAllDay: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateBlockedTimeParams {
  employeeId: number;
  blockedDate: Date_ISO_Type;
  startTime?: Time_HH_MM_SS_Type | null;
  endTime?: Time_HH_MM_SS_Type | null;
  isAllDay: boolean;
}

interface UpdateBlockedTimeParams {
  blockedDate?: Date_ISO_Type;
  startTime?: Time_HH_MM_SS_Type | null;
  endTime?: Time_HH_MM_SS_Type | null;
  isAllDay?: boolean;
}

/**
 * Get all blocked times for an employee starting from a specific date
 */
async function getEmployeeBlockedTimes(
  dbPool: Pool,
  employeeId: number,
  fromDate: Date_ISO_Type,
): Promise<EmployeeBlockedTimeData[]> {
  const sql = `
    SELECT
      id,
      employee_id,
      blocked_date,
      start_time,
      end_time,
      is_all_day,
      created_at,
      updated_at
    FROM EmployeeBlockedTimes
    WHERE employee_id = ? AND blocked_date >= ?
    ORDER BY blocked_date ASC, start_time ASC
  `;

  const [rows] = await dbPool.query<EmployeeBlockedTimeRow[]>(sql, [employeeId, fromDate]);

  return rows.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    blockedDate: row.blocked_date as Date_ISO_Type,
    startTime: row.start_time as Time_HH_MM_SS_Type | null,
    endTime: row.end_time as Time_HH_MM_SS_Type | null,
    isAllDay: Boolean(row.is_all_day),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get blocked times for multiple employees and specific dates
 * Used by calendar service to filter out blocked time slots
 */
async function getEmployeeBlockedTimesForDates(
  dbPool: Pool,
  employeeIds: number[],
  dates: Date_ISO_Type[],
): Promise<EmployeeBlockedTimeData[]> {
  if (employeeIds.length === 0 || dates.length === 0) {
    return [];
  }

  const sql = `
    SELECT
      id,
      employee_id,
      blocked_date,
      start_time,
      end_time,
      is_all_day,
      created_at,
      updated_at
    FROM EmployeeBlockedTimes
    WHERE employee_id IN (?) AND blocked_date IN (?)
    ORDER BY employee_id ASC, blocked_date ASC, start_time ASC
  `;

  const [rows] = await dbPool.query<EmployeeBlockedTimeRow[]>(sql, [employeeIds, dates]);

  return rows.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    blockedDate: row.blocked_date as Date_ISO_Type,
    startTime: row.start_time as Time_HH_MM_SS_Type | null,
    endTime: row.end_time as Time_HH_MM_SS_Type | null,
    isAllDay: Boolean(row.is_all_day),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get a specific blocked time by ID
 */
async function getBlockedTimeById(
  dbPool: Pool,
  blockedTimeId: number,
): Promise<EmployeeBlockedTimeData | null> {
  const sql = `
    SELECT
      id,
      employee_id,
      blocked_date,
      start_time,
      end_time,
      is_all_day,
      created_at,
      updated_at
    FROM EmployeeBlockedTimes
    WHERE id = ?
  `;

  const [rows] = await dbPool.query<EmployeeBlockedTimeRow[]>(sql, [blockedTimeId]);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    id: row.id,
    employeeId: row.employee_id,
    blockedDate: row.blocked_date as Date_ISO_Type,
    startTime: row.start_time as Time_HH_MM_SS_Type | null,
    endTime: row.end_time as Time_HH_MM_SS_Type | null,
    isAllDay: Boolean(row.is_all_day),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new blocked time for an employee
 */
async function createEmployeeBlockedTime(
  dbPool: Pool,
  params: CreateBlockedTimeParams,
): Promise<number> {
  const {
    employeeId, blockedDate, startTime, endTime, isAllDay,
  } = params;

  // Validate that blocked date is not in the past
  const today = dayjs().format(`YYYY-MM-DD`) as Date_ISO_Type;
  if (dayjs(blockedDate).isBefore(dayjs(today), `day`)) {
    throw new Error(`Cannot create blocked time for a past date`);
  }

  // If not all day, validate that start and end times are provided
  if (!isAllDay && (!startTime || !endTime)) {
    throw new Error(`Start time and end time are required when not blocking all day`);
  }

  // If not all day, validate that start time is before end time
  if (!isAllDay && startTime && endTime) {
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = dayjs(`2000-01-01 ${endTime}`);
    if (end.isSameOrBefore(start)) {
      throw new Error(`End time must be after start time`);
    }
  }

  const sql = `
    INSERT INTO EmployeeBlockedTimes (
      employee_id,
      blocked_date,
      start_time,
      end_time,
      is_all_day
    ) VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    employeeId,
    blockedDate,
    isAllDay ? null : startTime,
    isAllDay ? null : endTime,
    isAllDay ? 1 : 0,
  ];

  const [result] = await dbPool.query<ResultSetHeader>(sql, values);
  return result.insertId;
}

/**
 * Update an existing blocked time
 */
async function updateEmployeeBlockedTime(
  dbPool: Pool,
  blockedTimeId: number,
  params: UpdateBlockedTimeParams,
): Promise<void> {
  // First check if the blocked time exists
  const existingBlockedTime = await getBlockedTimeById(dbPool, blockedTimeId);
  if (!existingBlockedTime) {
    throw new Error(`Blocked time with ID ${blockedTimeId} not found`);
  }

  // Prepare update fields
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (params.blockedDate !== undefined) {
    // Validate that blocked date is not in the past
    const today = dayjs().format(`YYYY-MM-DD`) as Date_ISO_Type;
    if (dayjs(params.blockedDate).isBefore(dayjs(today), `day`)) {
      throw new Error(`Cannot update blocked time to a past date`);
    }
    updateFields.push(`blocked_date = ?`);
    updateValues.push(params.blockedDate);
  }

  if (params.isAllDay !== undefined) {
    updateFields.push(`is_all_day = ?`);
    updateValues.push(params.isAllDay ? 1 : 0);

    // If changing to all day, clear start and end times
    if (params.isAllDay) {
      updateFields.push(`start_time = NULL`);
      updateFields.push(`end_time = NULL`);
    }
  }

  // Only update times if not all day
  const isAllDay = params.isAllDay !== undefined ? params.isAllDay : existingBlockedTime.isAllDay;
  if (!isAllDay) {
    if (params.startTime !== undefined) {
      updateFields.push(`start_time = ?`);
      updateValues.push(params.startTime);
    }

    if (params.endTime !== undefined) {
      updateFields.push(`end_time = ?`);
      updateValues.push(params.endTime);
    }

    // Validate that start time is before end time
    const finalStartTime = params.startTime !== undefined ? params.startTime : existingBlockedTime.startTime;
    const finalEndTime = params.endTime !== undefined ? params.endTime : existingBlockedTime.endTime;

    if (finalStartTime && finalEndTime) {
      const start = dayjs(`2000-01-01 ${finalStartTime}`);
      const end = dayjs(`2000-01-01 ${finalEndTime}`);
      if (end.isSameOrBefore(start)) {
        throw new Error(`End time must be after start time`);
      }
    }
  }

  if (updateFields.length === 0) {
    return; // Nothing to update
  }

  const sql = `
    UPDATE EmployeeBlockedTimes
    SET ${updateFields.join(`, `)}
    WHERE id = ?
  `;

  updateValues.push(blockedTimeId);

  await dbPool.query<ResultSetHeader>(sql, updateValues);
}

/**
 * Delete a blocked time
 */
async function deleteEmployeeBlockedTime(
  dbPool: Pool,
  blockedTimeId: number,
): Promise<void> {
  const sql = `DELETE FROM EmployeeBlockedTimes WHERE id = ?`;
  const [result] = await dbPool.query<ResultSetHeader>(sql, [blockedTimeId]);

  if (result.affectedRows === 0) {
    throw new Error(`Blocked time with ID ${blockedTimeId} not found`);
  }
}

export {
  getEmployeeBlockedTimes,
  getEmployeeBlockedTimesForDates,
  getBlockedTimeById,
  createEmployeeBlockedTime,
  updateEmployeeBlockedTime,
  deleteEmployeeBlockedTime,
};

