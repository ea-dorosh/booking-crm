import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServicesContainer from "@/components/ServicesContainer/ServicesContainer";
import { categoryStatusEnum } from '@/enums/enums';
import { fetchEmployees } from '@/features/employees/employeesSlice';
import { fetchServiceCategories } from '@/features/serviceCategories/serviceCategoriesSlice';
import { fetchServices } from '@/features/services/servicesSlice';
import { fetchServiceSubCategories } from '@/features/serviceSubCategories/serviceSubCategoriesSlice';

export default function ServicesPage() {
  const dispatch = useDispatch();
  const services = useSelector(state => state.services.data);
  const employees = useSelector(state => state.employees.data);
  const serviceSubCategories = useSelector(state => state.serviceSubCategories.data);
  const serviceCategories = useSelector(state => state.serviceCategories.data);

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
    if (!serviceCategories) {
      const storedStatus = sessionStorage.getItem('categoriesStatusFilter');

      const statuses = storedStatus === 'all'
        ? [categoryStatusEnum.active, categoryStatusEnum.archived, categoryStatusEnum.disabled]
        : storedStatus ? [storedStatus] : [categoryStatusEnum.active];
      promises.push(dispatch(fetchServiceCategories(statuses)));
    }

    Promise.all(promises);
  }, []);

  return (
    <PageContainer pageTitle="Services">
      {services && employees && serviceSubCategories && serviceCategories && (
        <ServicesContainer
          employees={employees}
          subCategories={serviceSubCategories}
          categories={serviceCategories}
        />
      )}
    </PageContainer>
  );
}
