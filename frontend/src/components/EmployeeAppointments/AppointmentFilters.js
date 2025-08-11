import {
  FilterList,
  Clear,
  CalendarToday,
} from "@mui/icons-material";
import {
  Box,
  Select,
  MenuItem,
  TextField,
  Stack,
  Chip,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { SORT_DIRECTION, APPOINTMENTS_SORT_RULE } from '@/constants/sorting';
import { appointmentStatusEnum } from '@/enums/enums';
import { getDefaultAppointmentFilters } from '@/utils/appointmentFilters';

const statusOptions = [
  {
    value: null,
    label: `All Status`, 
  },
  {
    value: appointmentStatusEnum.active,
    label: `Active`, 
  },
  {
    value: appointmentStatusEnum.canceled,
    label: `Canceled`, 
  },
];

const sortOptions = [
  {
    value: APPOINTMENTS_SORT_RULE.DATE,
    label: `Appointment Date`, 
  },
  {
    value: APPOINTMENTS_SORT_RULE.CREATED_DATE,
    label: `Created Date`, 
  },
];

const sortOrderOptions = [
  {
    value: SORT_DIRECTION.DESC,
    label: `Newest First`, 
  },
  {
    value: SORT_DIRECTION.ASC,
    label: `Oldest First`, 
  },
];

export default function AppointmentFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  appointmentsCount = 0,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = () => {
    const defaults = getDefaultAppointmentFilters();

    return filters.startDate !== defaults.startDate ||
           filters.endDate !== defaults.endDate ||
           filters.status !== defaults.status ||
           filters.sortBy !== defaults.sortBy ||
           filters.sortOrder !== defaults.sortOrder;
  };

  const getActiveFiltersCount = () => {
    const defaults = getDefaultAppointmentFilters();
    let count = 0;

    if (filters.startDate !== defaults.startDate) count++;
    if (filters.endDate !== defaults.endDate) count++;
    if (filters.status !== defaults.status) count++;
    if (filters.sortBy !== defaults.sortBy) count++;
    if (filters.sortOrder !== defaults.sortOrder) count++;

    return count;
  };

  return (
    <Paper
      sx={{
        padding: 2,
        marginBottom: 2,
        backgroundColor: `grey.50`,
        border: `1px solid`,
        borderColor: `grey.200`,
        width: `100%`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: `flex`,
          justifyContent: `space-between`,
          alignItems: `flex-start`,
          marginBottom: isExpanded ? 2 : 0,
          flexWrap: `wrap`,
          gap: 1,
        }}>
        <Box
          sx={{
            display: `flex`,
            alignItems: `center`,
            gap: 1,
            flex: 1,
            minWidth: 0, 
          }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: `1.1rem`,
              fontWeight: 600,
              mr: `auto`, 
            }}>
            Recent Appointments
          </Typography>

          <Chip
            label={`${appointmentsCount} found`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Stack
          direction={{
            xs: `column`,
            sm: `row`, 
          }}
          spacing={1}
          sx={{
            flexShrink: 0,
            alignItems: {
              xs: `stretch`,
              sm: `center`, 
            },
            width: {
              xs: `100%`,
              sm: `auto`, 
            },
          }}
        >
          {hasActiveFilters() && (
            <Chip
              label={`${getActiveFiltersCount()} filters`}
              size="small"
              color="primary"
              onDelete={onClearFilters}
              deleteIcon={<Clear />}
              sx={{
                alignSelf: {
                  xs: `flex-end`,
                  sm: `auto`, 
                }, 
              }}
            />
          )}
          <Button
            size="small"
            variant={isExpanded ? `contained` : `outlined`}
            startIcon={<FilterList />}
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{
              minWidth: `auto`,
              fontSize: `0.8rem`,
              width: {
                xs: `100%`,
                sm: `auto`, 
              },
            }}
          >
            {isExpanded ? `Hide` : `Filter`}
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      {isExpanded && (
        <Stack
          spacing={2}>
          {/* Date Range */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                marginBottom: 1,
                fontWeight: 600,
                color: `text.secondary`, 
              }}>
              <CalendarToday
                sx={{
                  fontSize: 16,
                  verticalAlign: `middle`,
                  marginRight: 0.5, 
                }} />
              Date Range
            </Typography>
            <Stack
              direction={{
                xs: `column`,
                sm: `row`, 
              }}
              spacing={1}
              sx={{ width: `100%` }}
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0, 
                }}>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 0.5,
                    fontWeight: 500, 
                  }}>
                  Start Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={filters.startDate || ``}
                  onChange={(e) => handleFilterChange(`startDate`, e.target.value)}
                  sx={{ width: `100%` }}
                />
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0, 
                }}>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 0.5,
                    fontWeight: 500, 
                  }}>
                  End Date
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={filters.endDate || ``}
                  onChange={(e) => handleFilterChange(`endDate`, e.target.value)}
                  sx={{ width: `100%` }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Status & Sort */}
          <Stack
            direction={{
              xs: `column`,
              sm: `row`, 
            }}
            spacing={1}
            sx={{ width: `100%` }}
          >
            <Box
              sx={{
                flex: 1,
                minWidth: 100, 
              }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.5,
                  fontWeight: 500, 
                }}>
                Status
              </Typography>
              <Select
                size="small"
                value={filters.status !== null && filters.status !== undefined ? filters.status : ``}
                displayEmpty
                renderValue={(selected) => {
                  // Find the option that matches the selected value
                  const selectedOption = statusOptions.find(option => {
                    const optionValue = option.value !== null ? option.value : ``;
                    return optionValue === selected;
                  });

                  return selectedOption ? selectedOption.label : `Select Status`;
                }}
                onChange={(e) => {
                  const newValue = e.target.value === `` ? null : Number(e.target.value);
                  handleFilterChange(`status`, newValue);
                }}
                sx={{ width: `100%` }}
              >
                {statusOptions.map((option) => {
                  const menuItemKey = option.value !== null ? option.value : `all`;
                  const menuItemValue = option.value !== null ? option.value : ``;

                  return (
                    <MenuItem
                      key={menuItemKey}
                      value={menuItemValue}
                    >
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 100, 
              }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.5,
                  fontWeight: 500, 
                }}>
                Sort By
              </Typography>
              <Select
                size="small"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange(`sortBy`, e.target.value)}
                sx={{ width: `100%` }}
              >
                {sortOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 100, 
              }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.5,
                  fontWeight: 500, 
                }}>
                Order
              </Typography>
              <Select
                size="small"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange(`sortOrder`, e.target.value)}
                sx={{ width: `100%` }}
              >
                {sortOrderOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Stack>

          {/* Action Buttons */}
          {hasActiveFilters() && (
            <Box
              sx={{
                display: `flex`,
                justifyContent: `flex-end`, 
              }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Clear />}
                onClick={onClearFilters}
                sx={{ fontSize: `0.8rem` }}
              >
                Clear All Filters
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}