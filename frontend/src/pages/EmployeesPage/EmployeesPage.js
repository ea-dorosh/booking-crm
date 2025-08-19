import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import EmployeesContainer from "@/components/EmployeesContainer/EmployeesContainer";
import PageContainer from '@/components/PageContainer/PageContainer';
import { employeeStatusEnum } from '@/enums/enums';
import { fetchEmployees } from '@/features/employees/employeesSlice';

export default function EmployeesPage() {
  const dispatch = useDispatch();
  const employees = useSelector(state => state.employees.data);
  const [statusFilter, setStatusFilter] = useState(() => {
    return sessionStorage.getItem(`employeesStatusFilter`) || employeeStatusEnum.active;
  });

  useEffect(() => {
    fetchUpdatedEmployees();
  }, []);

  const fetchUpdatedEmployees = async () => {
    const storedStatus = sessionStorage.getItem(`employeesStatusFilter`) || employeeStatusEnum.active;
    const statuses = storedStatus === `all` ? [employeeStatusEnum.active, employeeStatusEnum.archived, employeeStatusEnum.disabled] : [storedStatus];
    await dispatch(fetchEmployees(statuses));
  }

  const handleStatusChange = (value) => {
    if (!value) return;
    setStatusFilter(value);
    sessionStorage.setItem(`employeesStatusFilter`, value);

    const statuses = value === `all` ? [employeeStatusEnum.active, employeeStatusEnum.archived, employeeStatusEnum.disabled] : [value];
    dispatch(fetchEmployees(statuses));
  };

  return (
    <PageContainer pageTitle="Team Members">
      <EmployeesContainer
        employees={employees}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
      />
    </PageContainer>
  );
}
