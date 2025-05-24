import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServicesContainer from "@/components/ServicesContainer/ServicesContainer";
import { fetchEmployees } from '@/features/employees/employeesSlice';
import { fetchServices, fetchServiceCategories } from '@/features/services/servicesSlice';


export default function ServicesPage() {
  const dispatch = useDispatch();
  const services = useSelector(state => state.services.data);
  const employees = useSelector(state => state.employees.data);
  const serviceCategories = useSelector(state => state.services.serviceCategories);

  useEffect(() => {
    if (!services.length) {
      dispatch(fetchServices());
    }
    if (!employees.length) {
      dispatch(fetchEmployees());
    }
    if (!serviceCategories) {
      dispatch(fetchServiceCategories());
    }
  }, []);

  return (
    <PageContainer pageTitle="Services">
      <ServicesContainer
        services={services}
        employees={employees}
        categories={serviceCategories}
      />
    </PageContainer>
  );
}
