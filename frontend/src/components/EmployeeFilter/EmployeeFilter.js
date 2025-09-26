import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { employeeStatusEnum } from '@/enums/enums';
import {
  setEmployeeId,
  fetchAppointments,
} from '@/features/appointments/appointmentsSlice';
import { fetchEmployees } from '@/features/employees/employeesSlice';

export default function EmployeeFilter() {
  const dispatch = useDispatch();

  const employees = useSelector((state) => state.employees.data);
  const selectedEmployeeId = useSelector((state) => state.appointments.employeeId);
  const isEmployeesLoading = useSelector((state) => state.employees.isCustomersDataRequestPending);

  useEffect(() => {
    // Load employees if not already loaded
    if (!employees || employees.length === 0) {
      dispatch(fetchEmployees([employeeStatusEnum.active]));
    }
  }, [dispatch, employees]);

  const handleEmployeeChange = (event) => {
    const employeeId = event.target.value === `` ? null : event.target.value;
    dispatch(setEmployeeId({ employeeId }));
    dispatch(fetchAppointments());
  };

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
        Filter by Employee
      </Typography>

      <FormControl
        size="small"
        fullWidth
        disabled={isEmployeesLoading}
      >
        <InputLabel>Employee</InputLabel>
        <Select
          value={selectedEmployeeId || ``}
          label="Employee"
          onChange={handleEmployeeChange}
        >
          <MenuItem value="">
            <em>All Employees</em>
          </MenuItem>
          {employees?.map((employee) => (
            <MenuItem
              key={employee.employeeId}
              value={employee.employeeId}
            >
              {`${employee.firstName} ${employee.lastName}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}
