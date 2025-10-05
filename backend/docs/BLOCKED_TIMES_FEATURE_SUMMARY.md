# Employee Blocked Times - Feature Summary

## 📋 Overview

Enhanced blocked times feature with support for date ranges, appointment conflict validation, and group management.

## ✨ New Features

### 1. **Date Range Support**
- Can block a single day or range of days (e.g., vacation from Dec 10-15)
- Parameter: `endDate` (optional, defaults to `blockedDate`)

### 2. **Appointment Conflict Validation**
- Automatically checks for existing appointments in the blocked time range
- Prevents blocking if conflicts exist
- Returns detailed error message with conflicting appointment dates

### 3. **Group Management (`group_id`)**
- Multiple-day blocks are stored as separate records with a shared `group_id` (UUID)
- Deleting one record in a group deletes the entire group
- Easy to display and manage on frontend as a single entity

## 🗄️ Database Changes

### Migration: `20251005120000_add_group_id_to_employee_blocked_times.js`

```sql
ALTER TABLE EmployeeBlockedTimes ADD COLUMN group_id VARCHAR(36) NULL;
ALTER TABLE EmployeeBlockedTimes ADD INDEX idx_employee_blocked_times_group_id (group_id);
```

## 📊 Logic for Multi-Day Blocks

Example: Block Dec 10 (10:00-14:00) through Dec 15

```
Dec 10: start_time: 10:00, end_time: 23:59, is_all_day: false, group_id: "uuid-123"
Dec 11: start_time: null,  end_time: null,  is_all_day: true,  group_id: "uuid-123"
Dec 12: start_time: null,  end_time: null,  is_all_day: true,  group_id: "uuid-123"
Dec 13: start_time: null,  end_time: null,  is_all_day: true,  group_id: "uuid-123"
Dec 14: start_time: null,  end_time: null,  is_all_day: true,  group_id: "uuid-123"
Dec 15: start_time: 00:00, end_time: 14:00, is_all_day: false, group_id: "uuid-123"
```

**Logic:**
- **First day**: From specified start time to end of day (23:59)
- **Middle days**: Full day blocks (`is_all_day: true`)
- **Last day**: From start of day (00:00) to specified end time

**Special case:** If `isAllDay` is true for the entire range, all days get `is_all_day: true`

## 🔧 API Changes

### POST `/api/protected/employees/:employeeId/blocked-times`

**Request Body:**
```json
{
  "blockedDate": "2024-12-10",
  "endDate": "2024-12-15",  // Optional (new!)
  "startTime": "10:00:00",
  "endTime": "14:00:00",
  "isAllDay": false
}
```

**Response (single day):**
```json
{
  "id": 123,
  "count": 1,
  "message": "Blocked time created successfully"
}
```

**Response (date range):**
```json
{
  "id": 123,
  "ids": [123, 124, 125, 126, 127, 128],
  "count": 6,
  "message": "Blocked time range created successfully (6 days)"
}
```

**Error Response (conflict):**
```json
{
  "message": "Cannot block time: employee has existing appointments on 10.12.2024, 12.12.2024. Please cancel or reschedule these appointments first."
}
```

### DELETE `/api/protected/employees/blocked-times/:blockedTimeId`

- If the blocked time has a `group_id`, **deletes the entire group**
- If no `group_id`, deletes only that specific record

## 🔍 New Service Functions

### `checkAppointmentConflicts()`
```typescript
async function checkAppointmentConflicts(
  dbPool: Pool,
  employeeId: number,
  startDate: Date_ISO_Type,
  endDate: Date_ISO_Type,
  startTime: Time_HH_MM_SS_Type | null,
  endTime: Time_HH_MM_SS_Type | null,
): Promise<{ hasConflict: boolean; conflictingAppointments: any[] }>
```

Checks if employee has appointments in the specified time range.

### `createEmployeeBlockedTime()`
```typescript
async function createEmployeeBlockedTime(
  dbPool: Pool,
  params: CreateBlockedTimeParams,
): Promise<number | number[]>  // Single ID or array of IDs
```

Creates one or multiple blocked time records with validation.

### `deleteBlockedTimeGroup()`
```typescript
async function deleteBlockedTimeGroup(
  dbPool: Pool,
  groupId: string,
): Promise<void>
```

Deletes all records in a group by `group_id`.

## 📝 Frontend Considerations

### Display Logic
```javascript
// Group blocked times by group_id for display
const groupedBlocks = blockedTimes.reduce((acc, block) => {
  const key = block.groupId || `single-${block.id}`;
  if (!acc[key]) acc[key] = [];
  acc[key].push(block);
  return acc;
}, {});

// Each group represents one "vacation" or "blocked period"
Object.values(groupedBlocks).forEach(group => {
  if (group.length > 1) {
    // Multi-day block
    const firstDay = group[0];
    const lastDay = group[group.length - 1];
    console.log(`Vacation: ${firstDay.blockedDate} to ${lastDay.blockedDate}`);
  } else {
    // Single day block
    console.log(`Blocked: ${group[0].blockedDate}`);
  }
});
```

### Delete Logic
```javascript
// Deleting any record in a group deletes the entire group
await deleteEmployeeBlockedTime(blockId);
// If this had a group_id, all related records are now deleted
```

### Add New Field: `endDate`
```javascript
// Add endDate picker to the form
<DatePicker
  label="End Date"
  value={endDate}
  onChange={setEndDate}
  minDate={blockedDate}  // Can't be before start date
/>

// Default endDate to blockedDate when blockedDate changes
useEffect(() => {
  if (blockedDate && !endDate) {
    setEndDate(blockedDate);
  }
}, [blockedDate]);
```

## ✅ Validation Rules

1. **Date Validation**:
   - `blockedDate` cannot be in the past
   - `endDate` cannot be before `blockedDate`

2. **Time Validation**:
   - If `!isAllDay`, both `startTime` and `endTime` required
   - `endTime` must be after `startTime`

3. **Appointment Conflicts**:
   - Cannot block if employee has appointments in that range
   - Must cancel/reschedule appointments first

## 🚀 Benefits

1. **No Logic Changes**: Existing calendar availability logic works without modification
2. **Easy to Manage**: Delete one record = delete entire vacation
3. **Clear History**: Can see exact dates blocked in database
4. **Flexible**: Supports both single-day and multi-day blocks
5. **Safe**: Prevents blocking when appointments exist

## 🧪 Testing Scenarios

1. **Single Day Block**:
   ```json
   { "blockedDate": "2024-12-10", "startTime": "10:00:00", "endTime": "14:00:00", "isAllDay": false }
   ```

2. **Multi-Day Block**:
   ```json
   { "blockedDate": "2024-12-10", "endDate": "2024-12-15", "isAllDay": true }
   ```

3. **Partial Day Range**:
   ```json
   { "blockedDate": "2024-12-10", "endDate": "2024-12-15", "startTime": "10:00:00", "endTime": "14:00:00", "isAllDay": false }
   ```

4. **Conflict Test**:
   - Create appointment on Dec 12
   - Try to block Dec 10-15
   - Should fail with error message

5. **Delete Group Test**:
   - Create multi-day block (Dec 10-15)
   - Delete any single record
   - Verify all 6 records deleted

