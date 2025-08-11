import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import EmployeesContainer from "@/components/EmployeesContainer/EmployeesContainer";
import PageContainer from '@/components/PageContainer/PageContainer';
import { fetchEmployees } from '@/features/employees/employeesSlice';

export default function EmployeesPage() {
  const dispatch = useDispatch();
  const employees = useSelector(state => state.employees.data);

  useEffect(() => {
    if (!employees || employees.length === 0) {
      dispatch(fetchEmployees());
    }
  }, []);

  return (
    <PageContainer
      pageTitle="Employees">
      {employees.length > 0 && <EmployeesContainer
        employees={employees}
      />}
    </PageContainer>
  );
}
