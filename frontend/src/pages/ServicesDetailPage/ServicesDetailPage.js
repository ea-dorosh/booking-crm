
import { Box, LinearProgress } from '@mui/material';
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import ServiceDetails from './components/ServiceDetails';
import ServiceEditForm from './components/ServiceEditForm';
import ServiceNotFound from './components/ServiceNotFound';
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import { fetchEmployees } from '@/features/employees/employeesSlice';
import { fetchServiceCategories } from '@/features/serviceCategories/serviceCategoriesSlice';
import {
  fetchServices,
  updateService,
  cleanError,
  cleanErrors,
  deleteService,
} from '@/features/services/servicesSlice';
import { fetchServiceSubCategories } from '@/features/serviceSubCategories/serviceSubCategoriesSlice';

export default function ServicesDetailPage() {
  const [isEditMode, setIsEditMode] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const shouldShowServiceForm = serviceId === `create-service`;

  const service = useSelector(state => state.services.data?.find(service => service.id === Number(serviceId)));
  const employees = useSelector(state => state.employees.data);
  const {
    updateFormErrors,
    isServicesRequestPending,
  } = useSelector(state => state.services);

  const serviceSubCategories = useSelector(state => state.serviceSubCategories.data);
  const serviceCategories = useSelector(state => state.serviceCategories.data);

  useEffect(() => {
    const promises = [];

    if (!serviceCategories) {
      promises.push(dispatch(fetchServiceCategories([`all`])));
    }

    if (!serviceSubCategories) {
      promises.push(dispatch(fetchServiceSubCategories([`all`])));
    }

    if (!employees.length) {
      promises.push(dispatch(fetchEmployees()));
    }

    if (!service && !shouldShowServiceForm) {
      promises.push(dispatch(fetchServices()));
    } else if (shouldShowServiceForm) {
      dispatch(cleanErrors());
      setIsEditMode(true)
    }

    Promise.all(promises);
  }, []);



  const updateServiceHandler = async (service) => {
    try {
      const serviceId = await dispatch(updateService(service)).unwrap();

      // Clear errors on successful update
      dispatch(cleanErrors());

      if (!service.id) {
        navigate(`/services/${serviceId}`, { replace: true });
      }

      dispatch(fetchServices());

      setIsEditMode(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCleanError = (fieldName) => {
    dispatch(cleanError(fieldName));
  };

  const handleCleanErrors = () => {
    dispatch(cleanErrors());
  };

  const onDeleteServiceClick = async () => {
    await dispatch(deleteService(service.id)).unwrap();
    await dispatch(fetchServices()).unwrap();

    navigate(`/services`);
  };

  const handleEditClick = () => {
    dispatch(cleanErrors());
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    dispatch(cleanErrors());
    setIsEditMode(false);
  };

  // Determine page title
  const getPageTitle = () => {
    if (isEditMode) {
      return service ? `Edit ${service.name}` : `New Service`;
    }
    if (!service && !shouldShowServiceForm) {
      return `Service Not Found`;
    }
    return service ? service.name : `New Service`;
  };

  // Determine content to render
  const renderContent = () => {
    // Show edit form
    if (isEditMode && serviceSubCategories && serviceCategories) {
      return (
        <ServiceEditForm
          service={service}
          employees={employees}
          serviceSubCategories={serviceSubCategories}
          serviceCategories={serviceCategories}
          updateFormErrors={updateFormErrors}
          shouldShowServiceForm={shouldShowServiceForm}
          onUpdateService={updateServiceHandler}
          onCleanError={handleCleanError}
          onCleanErrors={handleCleanErrors}
          onDeleteService={onDeleteServiceClick}
          onCancel={handleCancelEdit}
        />
      );
    }

    // Show not found
    if (!service && !shouldShowServiceForm) {
      return <ServiceNotFound
        onBackToServices={() => navigate(`/services`)} />;
    }

    // Show service details
    if (service && serviceSubCategories && serviceCategories) {
      return (
        <ServiceDetails
          service={service}
          employees={employees}
          serviceCategories={serviceCategories}
          serviceSubCategories={serviceSubCategories}
          onEditClick={handleEditClick}
        />
      );
    }

    // Loading state
    return null;
  };

  return (
    <PageContainer
      pageTitle={getPageTitle()}
      hideSideNav>
      <Box
        sx={{
          padding: {
            xs: 0,
            md: 0,
          },
        }}>
        {!isEditMode && <GoBackNavigation />}

        {isServicesRequestPending && (
          <Box
            sx={{ marginTop: 1 }}>
            <LinearProgress />
          </Box>
        )}

        {renderContent()}
      </Box>
    </PageContainer>
  );
}
