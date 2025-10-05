# Employee Blocked Times - Frontend Updates

## ✨ New Features

### 1. **Date Range Support**
- Added `selectedEndDate` state
- New "End Date" picker in the form
- Auto-updates `endDate` to match `selectedDate` when changed
- `minDate` for end date is set to `selectedDate`

### 2. **Group Display**
- `groupedBlockedTimes()` function groups records by `groupId`
- Single-day blocks display as before
- Multi-day blocks display with range: `10.12.2024 - 15.12.2024 (6 days)`

### 3. **Enhanced UI**
- "Start Date" and "End Date" labels (instead of just "Date")
- Multi-day chip badge showing number of days
- Improved formatting for date ranges

## 📋 Changes Made

### **EmployeeBlockedTimes.js**

#### State Updates:
```javascript
// Added
const [selectedEndDate, setSelectedEndDate] = useState(dayjs());

// Auto-sync endDate with selectedDate
useEffect(() => {
  if (selectedDate) {
    setSelectedEndDate(selectedDate);
  }
}, [selectedDate]);
```

#### Form Updates:
```jsx
<DatePicker
  label="Start Date"  // Changed from "Date"
  value={selectedDate}
  onChange={(newValue) => setSelectedDate(newValue)}
  minDate={dayjs()}
/>

<DatePicker
  label="End Date"  // NEW!
  value={selectedEndDate}
  onChange={(newValue) => setSelectedEndDate(newValue)}
  minDate={selectedDate || dayjs()}
/>
```

#### API Call Updates:
```javascript
const payload = {
  blockedDate: selectedDate.format(`YYYY-MM-DD`),
  endDate: selectedEndDate.format(`YYYY-MM-DD`),  // NEW!
  isAllDay,
  startTime: isAllDay ? null : `${startTime}:00`,
  endTime: isAllDay ? null : `${endTime}:00`,
};
```

#### Grouping Logic:
```javascript
const groupedBlockedTimes = () => {
  const groups = {};

  blockedTimes.forEach((blockedTime) => {
    const key = blockedTime.groupId || `single-${blockedTime.id}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(blockedTime);
  });

  return Object.values(groups).map((group) => {
    group.sort((a, b) => new Date(a.blockedDate) - new Date(b.blockedDate));
    return group;
  });
};
```

#### Display Formatting:
```javascript
const formatBlockedTimeDisplay = (group) => {
  if (group.length === 1) {
    // Single day: "10.12.2024 - 10:00 to 14:00"
    const blockedTime = group[0];
    const date = dayjs(blockedTime.blockedDate).format(`DD.MM.YYYY`);
    // ...
  }

  // Multi-day range: "10.12.2024 10:00 - 15.12.2024 14:00 (6 days)"
  const firstDay = group[0];
  const lastDay = group[group.length - 1];
  const startDate = dayjs(firstDay.blockedDate).format(`DD.MM.YYYY`);
  const endDate = dayjs(lastDay.blockedDate).format(`DD.MM.YYYY`);
  // ...
};
```

#### List Rendering:
```jsx
{groupedBlockedTimes().map((group) => {
  const blockedTime = group[0]; // Use first item for edit/delete
  return (
    <Card key={blockedTime.id}>
      {/* Display */}
      {formatBlockedTimeDisplay(group)}

      {/* Multi-day badge */}
      {group.length > 1 && (
        <Chip label={`${group.length} Days`} color="secondary" />
      )}

      {/* Delete button - deletes entire group */}
      <IconButton onClick={() => handleDeleteBlockedTime(blockedTime.id)}>
        <Delete />
      </IconButton>
    </Card>
  );
})}
```

## 🎨 UI Examples

### Single Day:
```
┌─────────────────────────────────────┐
│ 10.12.2024 - 10:00 to 14:00         │
│ [All Day]                            │
│                           [✏️] [🗑️]  │
└─────────────────────────────────────┘
```

### Multi-Day Range:
```
┌─────────────────────────────────────┐
│ 10.12.2024 10:00 - 15.12.2024 14:00 │
│ [6 Days] [All Day]                   │
│                           [✏️] [🗑️]  │
└─────────────────────────────────────┘
```

### Add Form:
```
┌─────────────────────────────────────┐
│ Add New Blocked Time                 │
│                                      │
│ Start Date: [10.12.2024    ▼]       │
│ End Date:   [15.12.2024    ▼]       │
│                                      │
│ ☑ Block all day                      │
│                                      │
│ Start Time: [10:00 ▼]               │
│ End Time:   [14:00 ▼]               │
│                                      │
│          [Cancel] [Add Blocked Time] │
└─────────────────────────────────────┘
```

## ✅ User Experience

### Creating a Vacation Block:
1. Click "Add Blocked Time"
2. Select **Start Date**: Dec 10
3. Select **End Date**: Dec 15 *(auto-filled when start date changes)*
4. Check "Block all day" or set specific times
5. Click "Add Blocked Time"
6. Success message: **"Blocked time range created successfully (6 days)"**

### Viewing Multi-Day Blocks:
- Displays as one item in the list
- Shows date range and duration
- Badge indicates number of days
- "All Day" chip if applicable

### Deleting Multi-Day Blocks:
- Clicking delete on any day in the group deletes **entire vacation**
- Confirmation: "Are you sure you want to delete this blocked time?"
- All 6 records removed automatically

### Error Handling:
- **Appointment conflict**: "Cannot block time: employee has existing appointments on 10.12.2024, 12.12.2024. Please cancel or reschedule these appointments first."
- **Past date**: "Cannot create blocked time for a past date"
- **Invalid range**: "End date cannot be before start date"

## 🔄 Data Flow

1. **User selects dates** → `selectedDate` and `selectedEndDate`
2. **Form submission** → Sends both dates to backend
3. **Backend creates records** → Multiple records with same `groupId`
4. **Response** → Returns count: `{ count: 6, message: "..." }`
5. **Success notification** → Shows backend message
6. **Reload** → Fetches updated blocked times
7. **Display** → Groups by `groupId`, shows as range

## 📱 Mobile Considerations

- Date pickers are touch-friendly (MUI DatePicker)
- Form stacks vertically on small screens
- Group display remains readable with abbreviated dates

## 🧪 Testing Checklist

- [ ] Single day block creation
- [ ] Multi-day block creation (2+ days)
- [ ] Same start/end date (should work as single day)
- [ ] End date before start date (should show error)
- [ ] All-day multi-day block
- [ ] Partial day multi-day block
- [ ] Viewing grouped blocks in list
- [ ] Deleting single-day block
- [ ] Deleting multi-day block (all records deleted)
- [ ] Editing single day in a group (TODO: decide behavior)
- [ ] Appointment conflict error display
- [ ] Success message for range shows day count

