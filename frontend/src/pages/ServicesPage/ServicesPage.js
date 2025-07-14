import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServicesContainer from "@/components/ServicesContainer/ServicesContainer";
import { fetchEmployees } from '@/features/employees/employeesSlice';
import { fetchServices } from '@/features/services/servicesSlice';
import { fetchServiceSubCategories } from '@/features/serviceSubCategories/serviceSubCategoriesSlice';


export default function ServicesPage() {
  const dispatch = useDispatch();
  const services = useSelector(state => state.services.data);
  const employees = useSelector(state => state.employees.data);
  const serviceSubCategories = useSelector(state => state.serviceSubCategories.data);

  useEffect(() => {
    const promises = [];

    if (!services) {
      promises.push(dispatch(fetchServices()));
    }
    if (!employees || employees.length === 0) {
      promises.push(dispatch(fetchEmployees()));
    }
    if (!serviceSubCategories) {
      promises.push(dispatch(fetchServiceSubCategories()));
    }

    Promise.all(promises);
  }, []);

  return (
    <PageContainer pageTitle="Services">
      <ServicesContainer
        services={services}
        employees={employees}
        subCategories={serviceSubCategories}
      />
    </PageContainer>
  );
}
