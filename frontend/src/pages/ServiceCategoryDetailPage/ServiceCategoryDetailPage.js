import { Box, LinearProgress } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServiceCategoryForm from "@/components/ServiceCategoryForm/ServiceCategoryForm";
import {
  fetchServiceCategories,
  updateCategory,
  cleanError,
  cleanErrors,
} from '@/features/serviceCategories/serviceCategoriesSlice';

export default function ServicesDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const serviceCategory = useSelector(state => state.serviceCategories.data?.find(category => category.id === Number(categoryId)));
  const {
    areCategoriesFetching,
    isUpdateCategoryRequestPending,
    formErrors,
  } = useSelector(state => state.serviceCategories);

  useEffect(() => {
    if (!serviceCategory) {
      dispatch(fetchServiceCategories());
    }

    // Clean errors when component unmounts
    return () => {
      dispatch(cleanErrors());
    };
  }, []);

  const categoryHandler = async (category) => {
    try {
      const categoryId = await dispatch(updateCategory(category)).unwrap();

      // Clear errors on successful update
      dispatch(cleanErrors());

      navigate(`/categories/${categoryId}`, { replace: true });

      dispatch(fetchServiceCategories());
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

  return (
    <PageContainer
      pageTitle={serviceCategory ?
        `${serviceCategory.name}`
        :
        `New Category`
      }
      hideSideNav
    >
      <GoBackNavigation />

      {(areCategoriesFetching || isUpdateCategoryRequestPending) && <Box mt={2}>
        <LinearProgress />
      </Box>}

      <Box mt={3}>
        {!areCategoriesFetching && <ServiceCategoryForm
          category={serviceCategory}
          submitForm={categoryHandler}
          formErrors={formErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
        />}
      </Box>
    </PageContainer>
  );
}
