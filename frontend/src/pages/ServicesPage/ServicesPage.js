import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServicesContainer from "@/components/ServicesContainer/ServicesContainer";
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
      // Always fetch all services - filtering will be done on frontend
      promises.push(dispatch(fetchServices()));
    }
    if (!employees || employees.length === 0) {
      // Always fetch all employees - filtering will be done on frontend
      promises.push(dispatch(fetchEmployees()));
    }
    if (!serviceSubCategories) {
      // Always fetch all sub-categories - filtering will be done on frontend
      promises.push(dispatch(fetchServiceSubCategories()));
    }
    if (!serviceCategories) {
      // Always fetch all categories - filtering will be done on frontend
      promises.push(dispatch(fetchServiceCategories()));
    }

    Promise.all(promises);
  }, []);

  return (
    <PageContainer
      pageTitle="Services"
    >
      {services && employees && serviceSubCategories && serviceCategories && (
        <ServicesContainer
          employees={employees}
        />
      )}
    </PageContainer>
  );
}
