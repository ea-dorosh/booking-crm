import { Box, LinearProgress } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServiceSubCategoryForm from "@/components/ServiceSubCategoryForm/ServiceSubCategoryForm";
import {
  fetchServiceSubCategories,
  updateSubCategory,
  cleanError,
  cleanErrors,
} from '@/features/serviceSubCategories/serviceSubCategoriesSlice';

export default function ServiceSubCategoryDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subCategoryId } = useParams();

  const serviceSubCategory = useSelector(state => state.serviceSubCategories.data?.find(subCategory => subCategory.id === Number(subCategoryId)));
  const {
    areSubCategoriesFetching,
    isUpdateSubCategoryRequestPending,
    formErrors,
  } = useSelector(state => state.serviceSubCategories);

  useEffect(() => {
    if (!serviceSubCategory) {
      dispatch(fetchServiceSubCategories());
    }

    // Clean errors when component unmounts
    return () => {
      dispatch(cleanErrors());
    };
  }, []);

  const subCategoryHandler = async (subCategory) => {
    try {
      const subCategoryId = await dispatch(updateSubCategory(subCategory)).unwrap();

      // Clear errors on successful update
      dispatch(cleanErrors());

      navigate(`/sub-categories/${subCategoryId}`, { replace: true });

      dispatch(fetchServiceSubCategories());
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
      pageTitle={serviceSubCategory ?
        `${serviceSubCategory.name}`
        :
        `New Sub Category`
      }
      hideSideNav
    >
      <GoBackNavigation />

      {(areSubCategoriesFetching || isUpdateSubCategoryRequestPending) && <Box mt={2}>
        <LinearProgress />
      </Box>}

      <Box mt={3}>
        {!areSubCategoriesFetching && <ServiceSubCategoryForm
          subCategory={serviceSubCategory}
          submitForm={subCategoryHandler}
          formErrors={formErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
        />}
      </Box>
    </PageContainer>
  );
}
