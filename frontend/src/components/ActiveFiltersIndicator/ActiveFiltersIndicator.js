import {
  Box,
  Chip,
  Stack,
} from "@mui/material";
import { useSelector } from 'react-redux';
import { appointmentStatusEnum } from '@/enums/enums';

export default function ActiveFiltersIndicator() {
  const status = useSelector((state) => state.appointments.status);
  const employeeIds = useSelector((state) => state.appointments.employeeIds);
  const employees = useSelector((state) => state.employees.data);

  const getStatusLabel = (statusValue) => {
    if (statusValue === appointmentStatusEnum.active) return `Active`;
    if (statusValue === appointmentStatusEnum.canceled) return `Canceled`;
    return `All`;
  };

  const getEmployeeNames = (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return [];
    if (!employees || employees.length === 0) return [];

    return selectedIds
      .map(id => {
        const employee = employees.find(emp => emp.employeeId === id);
        return employee ? `${employee.firstName} ${employee.lastName}` : null;
      })
      .filter(Boolean);
  };

  const statusLabel = getStatusLabel(status);
  const employeeNames = getEmployeeNames(employeeIds);
  const hasEmployeeFilter = employeeIds && employeeIds.length > 0;

  const totalEmployees = employees?.length || 0;
  const selectedEmployees = employeeIds?.length || 0;
  const allEmployeesSelected = selectedEmployees > 0 && selectedEmployees === totalEmployees;

  const hasStatusFilter = true;
  const hasActiveFilters = hasStatusFilter || hasEmployeeFilter;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        justifyContent: `center`,
      }}
    >
      {hasStatusFilter && (
        <Chip
          label={`Status: ${statusLabel}`}
          size="small"
          variant="outlined"
          color="primary"
          sx={{
            fontSize: `0.7rem`,
            height: 20,
          }}
        />
      )}

      {employeeNames.length > 0 && (
        <Chip
          label={
            allEmployeesSelected
              ? `All employees`
              : employeeNames.join(`, `)
          }
          size="small"
          variant="outlined"
          color="secondary"
          sx={{
            fontSize: `0.7rem`,
            height: 20,
            maxWidth: 200,
          }}
          title={
            allEmployeesSelected
              ? `All employees selected`
              : employeeNames.join(`, `)
          }
        />
      )}
    </Stack>
  );
}
