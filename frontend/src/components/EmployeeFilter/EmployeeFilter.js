import {
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
} from "@mui/material";
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { employeeStatusEnum } from '@/enums/enums';
import {
  setEmployeeIds,
  fetchAppointments,
} from '@/features/appointments/appointmentsSlice';
import { selectEmployeesByStatus } from '@/features/employees/employeesSelectors';
import { fetchEmployees } from '@/features/employees/employeesSlice';

export default function EmployeeFilter() {
  const dispatch = useDispatch();

  const employees = useSelector((state) => state.employees.data);
  const activeEmployees = useSelector((state) => selectEmployeesByStatus(state, employeeStatusEnum.active));
  const selectedEmployeeIds = useSelector((state) => state.appointments.employeeIds);
  const isEmployeesLoading = useSelector((state) => state.employees.isCustomersDataRequestPending);

  useEffect(() => {
    // Load employees if not already loaded
    if (!employees || employees.length === 0) {
      dispatch(fetchEmployees());
    }
  }, [dispatch, employees]);

  const handleEmployeeToggle = (employeeId) => {
    const currentIds = selectedEmployeeIds || [];
    const newIds = currentIds.includes(employeeId)
      ? currentIds.filter(id => id !== employeeId)
      : [...currentIds, employeeId];

    dispatch(setEmployeeIds({ employeeIds: newIds }));
    dispatch(fetchAppointments());
  };

  const handleSelectAll = () => {
    const allEmployeeIds = activeEmployees?.map(employee => employee.employeeId) || [];
    dispatch(setEmployeeIds({ employeeIds: allEmployeeIds }));
    dispatch(fetchAppointments());
  };

  const selectedCount = selectedEmployeeIds?.length || 0;
  const totalCount = activeEmployees?.length || 0;

  return (
    <>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mb: 1,
          display: `block`,
          fontWeight: 600,
          textTransform: `uppercase`,
          letterSpacing: `0.5px`,
        }}
      >
        Filter by Employee ({selectedCount}/{totalCount})
      </Typography>

      <Box sx={{ mb: 1 }}>
        <Button
          size="small"
          onClick={handleSelectAll}
          disabled={isEmployeesLoading || selectedCount === totalCount}
          sx={{
            minWidth: `auto`,
            fontSize: `0.75rem`,
          }}
        >
          Select All
        </Button>
      </Box>

      <FormGroup>
        {activeEmployees?.map((employee) => (
          <FormControlLabel
            key={employee.employeeId}
            control={
              <Checkbox
                checked={selectedEmployeeIds?.includes(employee.employeeId) || false}
                onChange={() => handleEmployeeToggle(employee.employeeId)}
                size="small"
                disabled={isEmployeesLoading}
              />
            }
            label={`${employee.firstName} ${employee.lastName}`}
            sx={{
              fontSize: `0.875rem`,
              '& .MuiFormControlLabel-label': {
                fontSize: `0.875rem`,
              },
            }}
          />
        ))}
      </FormGroup>
    </>
  );
}
