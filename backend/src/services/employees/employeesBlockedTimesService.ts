import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Date_ISO_Type, Time_HH_MM_SS_Type } from '@/@types/utilTypes.js';
import { dayjs } from '@/services/dayjs/dayjsService.js';
import { v4 as uuidv4 } from 'uuid';

interface EmployeeBlockedTimeRow extends RowDataPacket {
  id: number;
  group_id: string | null;
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
  groupId?: string | null;
  employeeId: number;
  blockedDate: Date_ISO_Type; // Formatted as YYYY-MM-DD string
  startTime: Time_HH_MM_SS_Type | null;
  endTime: Time_HH_MM_SS_Type | null;
  isAllDay: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateBlockedTimeParams {
  employeeId: number;
  blockedDate: Date_ISO_Type;
  endDate?: Date_ISO_Type; // For blocking a range of dates
  startTime?: Time_HH_MM_SS_Type | null;
  endTime?: Time_HH_MM_SS_Type | null;
  isAllDay: boolean;
}

interface UpdateBlockedTimeParams {
  blockedDate?: Date_ISO_Type;
  endDate?: Date_ISO_Type;
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
      group_id,
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
    groupId: row.group_id,
    employeeId: row.employee_id,
    blockedDate: dayjs(row.blocked_date).format(`YYYY-MM-DD`) as Date_ISO_Type,
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
      group_id,
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
    groupId: row.group_id,
    employeeId: row.employee_id,
    blockedDate: dayjs(row.blocked_date).format(`YYYY-MM-DD`) as Date_ISO_Type,
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
      group_id,
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
    groupId: row.group_id,
    employeeId: row.employee_id,
    blockedDate: dayjs(row.blocked_date).format(`YYYY-MM-DD`) as Date_ISO_Type,
    startTime: row.start_time as Time_HH_MM_SS_Type | null,
    endTime: row.end_time as Time_HH_MM_SS_Type | null,
    isAllDay: Boolean(row.is_all_day),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Check if employee has any appointments in the specified time range
 * Note: startTime and endTime are expected to be in Europe/Berlin timezone
 * SavedAppointments.time_start and time_end are stored in UTC format (without timezone marker)
 */
async function checkAppointmentConflicts(
  dbPool: Pool,
  employeeId: number,
  startDate: Date_ISO_Type,
  endDate: Date_ISO_Type,
  startTime: Time_HH_MM_SS_Type | null,
  endTime: Time_HH_MM_SS_Type | null,
): Promise<{ hasConflict: boolean; conflictingAppointments: any[] }> {
  if (startTime && endTime) {
    // Check for specific time conflicts
    // Convert Berlin time to UTC for comparison with database values (which are stored in UTC)
    const conflicts: any[] = [];
    let currentDate = dayjs(startDate);
    const lastDate = dayjs(endDate);

    while (currentDate.isSameOrBefore(lastDate, `day`)) {
      const dateStr = currentDate.format(`YYYY-MM-DD`);

      // Convert Berlin time to UTC for this specific date
      const startDateTime = dayjs.tz(`${dateStr} ${startTime}`, `Europe/Berlin`).utc();
      const endDateTime = dayjs.tz(`${dateStr} ${endTime}`, `Europe/Berlin`).utc();

      // Extract date and time components in UTC
      const utcStartDate = startDateTime.format(`YYYY-MM-DD`);
      const utcEndDate = endDateTime.format(`YYYY-MM-DD`);
      const utcStartTime = startDateTime.format(`HH:mm:ss`);
      const utcEndTime = endDateTime.format(`HH:mm:ss`);

      // Query for appointments that overlap with this UTC time range
      // SavedAppointments times are stored in UTC, so we compare UTC to UTC
      let sql: string;
      let params: any[];

      if (utcStartDate === utcEndDate) {
        // Time range is within same UTC day
        // Check for overlaps: appointment overlaps if it starts before block ends AND ends after block starts
        sql = `
          SELECT
            id,
            time_start,
            time_end,
            DATE(time_start) as appointment_date,
            TIME(time_start) as start_time,
            TIME(time_end) as end_time
          FROM SavedAppointments
          WHERE employee_id = ?
            AND DATE(time_start) = ?
            AND status = 0
            AND TIME(time_start) < ?
            AND TIME(time_end) > ?
          LIMIT 10
        `;
        params = [employeeId, utcStartDate, utcEndTime, utcStartTime];
      } else {
        // Time range spans midnight in UTC (e.g., 23:00 to 01:00 next day)
        sql = `
          SELECT
            id,
            time_start,
            time_end,
            DATE(time_start) as appointment_date,
            TIME(time_start) as start_time,
            TIME(time_end) as end_time
          FROM SavedAppointments
          WHERE employee_id = ?
            AND (
              (DATE(time_start) = ? AND TIME(time_start) >= ?)
              OR (DATE(time_start) = ? AND TIME(time_start) < ?)
            )
            AND status = 0
          LIMIT 10
        `;
        params = [employeeId, utcStartDate, utcStartTime, utcEndDate, utcEndTime];
      }

      const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
      conflicts.push(...rows);

      currentDate = currentDate.add(1, `day`);
    }

    return {
      hasConflict: conflicts.length > 0,
      conflictingAppointments: conflicts,
    };
  } else {
    // Check for any appointments on these dates (all day block)
    const sql = `
      SELECT
        id,
        time_start,
        time_end,
        DATE(time_start) as appointment_date,
        TIME(time_start) as start_time,
        TIME(time_end) as end_time
      FROM SavedAppointments
      WHERE employee_id = ?
        AND DATE(time_start) >= ?
        AND DATE(time_start) <= ?
        AND status = 0
      LIMIT 10
    `;
    const params = [employeeId, startDate, endDate];

    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);

    return {
      hasConflict: rows.length > 0,
      conflictingAppointments: rows,
    };
  }
}

/**
 * Create a new blocked time for an employee (supports date ranges)
 */
async function createEmployeeBlockedTime(
  dbPool: Pool,
  params: CreateBlockedTimeParams,
): Promise<number | number[]> {
  const {
    employeeId, blockedDate, endDate, startTime, endTime, isAllDay,
  } = params;

  // Determine the actual end date (defaults to start date if not provided)
  const actualEndDate = endDate || blockedDate;

  // Validate that blocked date is not in the past
  const today = dayjs().format(`YYYY-MM-DD`) as Date_ISO_Type;
  if (dayjs(blockedDate).isBefore(dayjs(today), `day`)) {
    throw new Error(`Cannot create blocked time for a past date`);
  }

  // Validate that end date is not before start date
  if (dayjs(actualEndDate).isBefore(dayjs(blockedDate), `day`)) {
    throw new Error(`End date cannot be before start date`);
  }

  // If not all day, validate that start and end times are provided
  if (!isAllDay && (!startTime || !endTime)) {
    throw new Error(`Start time and end time are required when not blocking all day`);
  }

  // If not all day, validate that start time is before end time
  // Allow end time to be before start time if end date is after start date (crossing midnight)
  if (!isAllDay && startTime && endTime) {
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = dayjs(`2000-01-01 ${endTime}`);

    // Only validate time if dates are the same
    if (dayjs(blockedDate).isSame(dayjs(actualEndDate), `day`) && end.isSameOrBefore(start)) {
      throw new Error(`End time must be after start time`);
    }
  }

  // Check for appointment conflicts
  const conflictCheck = await checkAppointmentConflicts(
    dbPool,
    employeeId,
    blockedDate,
    actualEndDate,
    isAllDay ? null : startTime || null,
    isAllDay ? null : endTime || null,
  );

  if (conflictCheck.hasConflict) {
    const conflictDates = conflictCheck.conflictingAppointments
      .map((apt) => dayjs(apt.appointment_date).format(`DD.MM.YYYY`))
      .join(`, `);
    throw new Error(
      `Cannot block time: employee has existing appointments on ${conflictDates}. ` +
      `Please cancel or reschedule these appointments first.`,
    );
  }

  // If it's a single day, create one record
  if (dayjs(blockedDate).isSame(dayjs(actualEndDate), `day`)) {
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

  // Multiple days - create a group of records
  const groupId = uuidv4();
  const insertedIds: number[] = [];

  // Generate all dates in the range
  const dates: Date_ISO_Type[] = [];
  let currentDate = dayjs(blockedDate);
  const endDateDayjs = dayjs(actualEndDate);

  while (currentDate.isSameOrBefore(endDateDayjs, `day`)) {
    dates.push(currentDate.format(`YYYY-MM-DD`) as Date_ISO_Type);
    currentDate = currentDate.add(1, `day`);
  }

  // Insert records for each date with appropriate logic
  for (let index = 0; index < dates.length; index++) {
    const date = dates[index];
    const isFirstDay = index === 0;
    const isLastDay = index === dates.length - 1;

    let recordStartTime: Time_HH_MM_SS_Type | null = null;
    let recordEndTime: Time_HH_MM_SS_Type | null = null;
    let recordIsAllDay = true;

    if (isAllDay) {
      // All days are full day blocks
      recordIsAllDay = true;
    } else if (isFirstDay && isLastDay) {
      // Same day, already handled above, this shouldn't happen
      recordStartTime = startTime || null;
      recordEndTime = endTime || null;
      recordIsAllDay = false;
    } else if (isFirstDay) {
      // First day: from specified start time to end of working day
      recordStartTime = startTime || null;
      recordEndTime = `23:59:00` as Time_HH_MM_SS_Type;
      recordIsAllDay = false;
    } else if (isLastDay) {
      // Last day: from start of working day to specified end time
      recordStartTime = `00:00:00` as Time_HH_MM_SS_Type;
      recordEndTime = endTime || null;
      recordIsAllDay = false;
    } else {
      // Middle days: full day block
      recordIsAllDay = true;
    }

    const sql = `
      INSERT INTO EmployeeBlockedTimes (
        group_id,
        employee_id,
        blocked_date,
        start_time,
        end_time,
        is_all_day
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      groupId,
      employeeId,
      date,
      recordIsAllDay ? null : recordStartTime,
      recordIsAllDay ? null : recordEndTime,
      recordIsAllDay ? 1 : 0,
    ];

    const [result] = await dbPool.query<ResultSetHeader>(sql, values);
    insertedIds.push(result.insertId);
  }

  return insertedIds;
}

/**
 * Update an existing blocked time
 */
async function updateEmployeeBlockedTime(
  dbPool: Pool,
  blockedTimeId: number,
  params: UpdateBlockedTimeParams,
): Promise<number | number[]> {
  // First check if the blocked time exists
  const existingBlockedTime = await getBlockedTimeById(dbPool, blockedTimeId);
  if (!existingBlockedTime) {
    throw new Error(`Blocked time with ID ${blockedTimeId} not found`);
  }

  // If endDate is provided and is different from blockedDate, this is a range update
  // We need to delete the old entry/group and create new ones
  const blockedDate = params.blockedDate || existingBlockedTime.blockedDate;
  const endDate = params.endDate || blockedDate;
  const isRangeUpdate = endDate !== blockedDate;

  if (isRangeUpdate || (params.endDate && existingBlockedTime.groupId)) {
    // Range update: delete old entries and create new ones
    if (existingBlockedTime.groupId) {
      // Delete entire group
      await deleteBlockedTimeGroup(dbPool, existingBlockedTime.groupId);
    } else {
      // Delete single entry
      await dbPool.query<ResultSetHeader>(
        `DELETE FROM EmployeeBlockedTimes WHERE id = ?`,
        [blockedTimeId],
      );
    }

    // Create new entries
    const createParams: CreateBlockedTimeParams = {
      employeeId: existingBlockedTime.employeeId,
      blockedDate,
      endDate,
      startTime: params.startTime !== undefined ? params.startTime : existingBlockedTime.startTime,
      endTime: params.endTime !== undefined ? params.endTime : existingBlockedTime.endTime,
      isAllDay: params.isAllDay !== undefined ? params.isAllDay : existingBlockedTime.isAllDay,
    };

    return await createEmployeeBlockedTime(dbPool, createParams);
  }

  // Single day update: update in place
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

      // Only validate time if dates are the same
      if (dayjs(blockedDate).isSame(dayjs(endDate), `day`) && end.isSameOrBefore(start)) {
        throw new Error(`End time must be after start time`);
      }
    }
  }

  if (updateFields.length === 0) {
    return blockedTimeId; // Nothing to update
  }

  const sql = `
    UPDATE EmployeeBlockedTimes
    SET ${updateFields.join(`, `)}
    WHERE id = ?
  `;

  updateValues.push(blockedTimeId);

  await dbPool.query<ResultSetHeader>(sql, updateValues);
  return blockedTimeId;
}

/**
 * Delete a blocked time (or entire group if it has a group_id)
 */
async function deleteEmployeeBlockedTime(
  dbPool: Pool,
  blockedTimeId: number,
): Promise<void> {
  // First, check if this blocked time is part of a group
  const blockedTime = await getBlockedTimeById(dbPool, blockedTimeId);

  if (!blockedTime) {
    throw new Error(`Blocked time with ID ${blockedTimeId} not found`);
  }

  let sql: string;
  let params: any[];

  if (blockedTime.groupId) {
    // Delete all records in the same group
    sql = `DELETE FROM EmployeeBlockedTimes WHERE group_id = ?`;
    params = [blockedTime.groupId];
  } else {
    // Delete only this specific record
    sql = `DELETE FROM EmployeeBlockedTimes WHERE id = ?`;
    params = [blockedTimeId];
  }

  const [result] = await dbPool.query<ResultSetHeader>(sql, params);

  if (result.affectedRows === 0) {
    throw new Error(`Failed to delete blocked time`);
  }
}

/**
 * Delete an entire group of blocked times by group_id
 */
async function deleteBlockedTimeGroup(
  dbPool: Pool,
  groupId: string,
): Promise<void> {
  const sql = `DELETE FROM EmployeeBlockedTimes WHERE group_id = ?`;
  const [result] = await dbPool.query<ResultSetHeader>(sql, [groupId]);

  if (result.affectedRows === 0) {
    throw new Error(`No blocked times found with group ID ${groupId}`);
  }
}

export {
  getEmployeeBlockedTimes,
  getEmployeeBlockedTimesForDates,
  getBlockedTimeById,
  createEmployeeBlockedTime,
  updateEmployeeBlockedTime,
  deleteEmployeeBlockedTime,
  deleteBlockedTimeGroup,
  checkAppointmentConflicts,
};

