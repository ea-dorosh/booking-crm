import { Box } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServiceCategoryForm from "@/components/ServiceCategoryForm/ServiceCategoryForm";
import {
  fetchServiceCategories,
  updateService,
  cleanError,
  cleanErrors,
  resetUpdateFormStatus,
} from '@/features/serviceCategories/serviceCategoriesSlice';

export default function ServicesDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const serviceCategory = useSelector(state => state.serviceCategories.data?.find(category => category.id === Number(categoryId)));
  const { loading } = useSelector(state => state.serviceCategories);
  const formErrors = useSelector(state => state.services.updateFormErrors);
  const updateFormStatus = useSelector(state => state.services.updateFormStatus);

  useEffect(() => {
    dispatch(fetchServiceCategories());
  }, []);

  useEffect(() => {
    (async () => {
      if (updateFormStatus === `succeeded`) {
        navigate(-1);
        dispatch(resetUpdateFormStatus());
      }
    })();
  }, [updateFormStatus]);

  const updateServiceCategoryHandler = (service) => {
    dispatch(updateService(service));
  };

  const handleCleanError = (fieldName) => {
    dispatch(cleanError(fieldName));
  };

  const handleCleanErrors = () => {
    dispatch(cleanErrors());
  };

  return (
    <PageContainer 
      pageTitle={serviceCategory ? 
        `${serviceCategory.name}` 
        :
        `New Service Category`
      }
      hideSideNav
    >
      <GoBackNavigation />

      <Box mt={3}>
        {!loading && <ServiceCategoryForm
          category={serviceCategory}
          createNewCategory={updateServiceCategoryHandler}
          formErrors={formErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
        />}
      </Box>
    </PageContainer>
  );
}
