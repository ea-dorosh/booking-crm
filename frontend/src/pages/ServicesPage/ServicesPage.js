import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServicesContainer from "@/components/ServicesContainer/ServicesContainer";
import { fetchEmployees } from '@/features/employees/employeesSlice';
import { fetchServices } from '@/features/services/servicesSlice';


export default function ServicesPage() {
  const dispatch = useDispatch();
  const services = useSelector(state => state.services.data);
  const employees = useSelector(state => state.employees.data);

  useEffect(() => {
    if (!services.length) {
      dispatch(fetchServices());
    }
    if (!employees.length) {
      dispatch(fetchEmployees());
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer pageTitle="Services">
      <ServicesContainer
        services={services}
        employees={employees}
      />
    </PageContainer>
  );
}
