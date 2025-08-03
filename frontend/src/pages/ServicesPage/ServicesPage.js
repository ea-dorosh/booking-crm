import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServicesContainer from "@/components/ServicesContainer/ServicesContainer";
import { fetchEmployees } from '@/features/employees/employeesSlice';
import { fetchServiceCategories } from '@/features/serviceCategories/serviceCategoriesSlice';
import { fetchServices } from '@/features/services/servicesSlice';
import { fetchServiceSubCategories } from '@/features/serviceSubCategories/serviceSubCategoriesSlice';

// SessionStorage key for general page scroll position
const SERVICES_PAGE_SCROLL_KEY = 'services-page-scroll-position';

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
      promises.push(dispatch(fetchServiceCategories()));
    }

    Promise.all(promises);
  }, []);

  useEffect(() => {
    // Save scroll position when navigating away
    const saveScrollPosition = () => {
      sessionStorage.setItem(SERVICES_PAGE_SCROLL_KEY, window.scrollY.toString());
    };

    window.addEventListener('beforeunload', saveScrollPosition);
    window.addEventListener('popstate', saveScrollPosition);

    return () => {
      saveScrollPosition();
      window.removeEventListener('beforeunload', saveScrollPosition);
      window.removeEventListener('popstate', saveScrollPosition);
    };
  }, []);

  useEffect(() => {
    if (services && employees && serviceSubCategories && serviceCategories) {
      const savedScrollPosition = sessionStorage.getItem(SERVICES_PAGE_SCROLL_KEY);

      if (savedScrollPosition) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          setTimeout(() => {
            const targetScroll = parseInt(savedScrollPosition, 10);
            console.log('✅ [ServicesPage] Restoring scroll to:', targetScroll);
            window.scrollTo(0, targetScroll);
          }, 200);
        });
      }
    }
  }, [services, employees, serviceSubCategories, serviceCategories]);

  return (
    <PageContainer pageTitle="Services">
      <ServicesContainer
        employees={employees}
        subCategories={serviceSubCategories}
        categories={serviceCategories}
      />
    </PageContainer>
  );
}
