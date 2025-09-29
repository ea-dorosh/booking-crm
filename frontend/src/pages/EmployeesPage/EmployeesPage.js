import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import EmployeesContainer from "@/components/EmployeesContainer/EmployeesContainer";
import PageContainer from '@/components/PageContainer/PageContainer';
import { employeeStatusEnum } from '@/enums/enums';
import { selectEmployeesByStatus } from '@/features/employees/employeesSelectors';
import { fetchEmployees } from '@/features/employees/employeesSlice';

export default function EmployeesPage() {
  const dispatch = useDispatch();
  const employees = useSelector(state => state.employees.data);
  const [statusFilter, setStatusFilter] = useState(() => {
    return sessionStorage.getItem(`employeesStatusFilter`) || employeeStatusEnum.active;
  });
  const filteredEmployees = useSelector(state => selectEmployeesByStatus(state, statusFilter));

  useEffect(() => {
    if (!employees || employees.length === 0) {
      // Always fetch all employees - filtering will be done on frontend
      dispatch(fetchEmployees());
    }
  }, []);

  const handleStatusChange = (value) => {
    if (!value) return;
    setStatusFilter(value);
    sessionStorage.setItem(`employeesStatusFilter`, value);
  };

  return (
    <PageContainer pageTitle="Team Members">
      <EmployeesContainer
        employees={filteredEmployees}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
      />
    </PageContainer>
  );
}
