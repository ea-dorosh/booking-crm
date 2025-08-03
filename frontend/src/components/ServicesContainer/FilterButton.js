import FilterListIcon from '@mui/icons-material/FilterList';
import {
  IconButton,
  Typography,
  Box,
  Popover,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Badge
} from "@mui/material";
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleEmployeeFilter, clearEmployeeFilter } from '@/features/services/servicesSlice';

export default function FilterButton({ employees }) {
  const dispatch = useDispatch();
  const selectedEmployees = useSelector(state => state.services.selectedEmployees);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleEmployeeToggle = (employeeId) => {
    dispatch(toggleEmployeeFilter(employeeId));
  };

  const handleClearFilter = () => {
    dispatch(clearEmployeeFilter());
  };

  const isOpen = Boolean(anchorEl);

  if (!employees || employees.length === 0) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          display: `flex`,
          alignItems: `center`,
          marginTop: `20px`,
          marginRight: `10px`,
          backgroundColor: selectedEmployees.length > 0 ? `#4caf50` : `#757575`,
          width: `fit-content`,
          padding: `10px 20px 10px 30px`,
          borderRadius: `50px`,
          cursor: 'pointer'
        }}
        onClick={handleFilterClick}
      >
        <Typography
          variant="button"
          sx={{ color: `#fff`, marginRight: '8px' }}
        >
          Filter
        </Typography>

        <Badge badgeContent={selectedEmployees.length} color="error">
          <IconButton
            sx={{ color: `#fff` }}
          >
            <FilterListIcon />
          </IconButton>
        </Badge>
      </Box>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            maxWidth: '300px',
            maxHeight: '400px',
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ padding: '16px' }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              Filter by Employees
            </Typography>
            {selectedEmployees.length > 0 && (
              <Button
                size="small"
                onClick={handleClearFilter}
                sx={{ fontSize: '0.75rem', marginLeft: '14px' }}
              >
                Clear
              </Button>
            )}
          </Box>

          <Divider sx={{ marginBottom: '12px' }} />

          {employees.map((employee) => (
            <FormControlLabel
              key={employee.employeeId}
              control={
                <Checkbox
                  checked={selectedEmployees.includes(employee.employeeId)}
                  onChange={() => handleEmployeeToggle(employee.employeeId)}
                  size="small"
                />
              }
              label={
                <Typography sx={{ fontSize: '0.9rem' }}>
                  {`${employee.firstName} ${employee.lastName}`}
                </Typography>
              }
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                margin: '4px 0',
                padding: '4px 8px',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            />
          ))}
        </Box>
      </Popover>
    </>
  );
}