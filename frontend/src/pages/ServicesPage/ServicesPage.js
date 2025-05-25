import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServicesContainer from "@/components/ServicesContainer/ServicesContainer";
import { fetchEmployees } from '@/features/employees/employeesSlice';
import { fetchServiceCategories } from '@/features/serviceCategories/serviceCategoriesSlice';
import { fetchServices } from '@/features/services/servicesSlice';


export default function ServicesPage() {
  const dispatch = useDispatch();
  const services = useSelector(state => state.services.data);
  const employees = useSelector(state => state.employees.data);
  const serviceCategories = useSelector(state => state.serviceCategories.data);

  useEffect(() => {
    const promises = [];

    if (!services) {
      console.log(`ServicesPage fetchServices`);

      promises.push(dispatch(fetchServices()));
    }
    if (!employees.length) {
      promises.push(dispatch(fetchEmployees()));
    }
    if (!serviceCategories) {
      promises.push(dispatch(fetchServiceCategories()));
    }

    Promise.all(promises);
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
