import {
  Box,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  useEffect,
  useState,
} from "react";
import {
  useDispatch,
  useSelector,
} from 'react-redux';
import {
  useParams,
  useNavigate,
} from "react-router-dom";
import SubCategoryDetails from '../../components/SubCategoryDetails/SubCategoryDetails';
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServiceSubCategoryForm from "@/components/ServiceSubCategoryForm/ServiceSubCategoryForm";
import { subCategoryStatusEnum } from '@/enums/enums';
import { fetchServiceCategories } from '@/features/serviceCategories/serviceCategoriesSlice';
import {
  fetchServiceSubCategories,
  updateSubCategory,
  cleanError,
  cleanErrors,
} from '@/features/serviceSubCategories/serviceSubCategoriesSlice';

export default function ServiceSubCategoryDetailPage() {
  const [isEditMode, setIsEditMode] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subCategoryId } = useParams();
  const shouldShowSubCategoryForm = subCategoryId === `create-sub-category`;

  const serviceSubCategory = useSelector(state => state.serviceSubCategories.data?.find(subCategory => subCategory.id === Number(subCategoryId)));
  const serviceCategories = useSelector(state => state.serviceCategories.data);


  const {
    areSubCategoriesFetching,
    isUpdateSubCategoryRequestPending,
    updateFormErrors,
  } = useSelector(state => state.serviceSubCategories);



  useEffect(() => {
    const promises = [];

    if (!serviceCategories) {
      promises.push(dispatch(fetchServiceCategories()));
    }

    if (!serviceSubCategory && !shouldShowSubCategoryForm) {
      const storedStatus = sessionStorage.getItem(`subCategoriesStatusFilter`);
      const statuses = storedStatus === `all`
        ? [subCategoryStatusEnum.active, subCategoryStatusEnum.archived, subCategoryStatusEnum.disabled]
        : storedStatus ? [storedStatus] : [subCategoryStatusEnum.active];
      promises.push(dispatch(fetchServiceSubCategories(statuses)));
    } else if (shouldShowSubCategoryForm) {
      dispatch(cleanErrors());
      setIsEditMode(true);
    }

    Promise.all(promises);

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

  const getPageTitle = () => {
    if (isEditMode) return serviceSubCategory ? `Edit ${serviceSubCategory.name}` : `New Sub Category`;
    return serviceSubCategory ? serviceSubCategory.name : `New Sub Category`;
  };

  const handleEditClick = () => {
    dispatch(cleanErrors());
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    dispatch(cleanErrors());
    setIsEditMode(false);
  };

  const handleArchiveToggle = async () => {
    if (!serviceSubCategory) return;
    const isArchived = String(serviceSubCategory.status).toLowerCase() === subCategoryStatusEnum.archived;
    const nextStatus = isArchived ? subCategoryStatusEnum.active : subCategoryStatusEnum.archived;
    await dispatch(updateSubCategory({
      id: serviceSubCategory.id, status: nextStatus, 
    }));
    await dispatch(fetchServiceSubCategories([subCategoryStatusEnum.active, subCategoryStatusEnum.archived, subCategoryStatusEnum.disabled]));
  };

  const handleDeactivateToggle = async () => {
    if (!serviceSubCategory) return;
    const isDisabled = String(serviceSubCategory.status).toLowerCase() === subCategoryStatusEnum.disabled;
    const nextStatus = isDisabled ? subCategoryStatusEnum.active : subCategoryStatusEnum.disabled;
    await dispatch(updateSubCategory({
      id: serviceSubCategory.id, status: nextStatus, 
    }));
    await dispatch(fetchServiceSubCategories([subCategoryStatusEnum.active, subCategoryStatusEnum.archived, subCategoryStatusEnum.disabled]));
  };

  return (
    <PageContainer pageTitle={getPageTitle()} hideSideNav>
      <Box sx={{
        padding: {
          xs: 0, md: 0, maxWidth: `768px`, 
        }, 
      }}>
        {!isEditMode && <GoBackNavigation />}

        {(isUpdateSubCategoryRequestPending || areSubCategoriesFetching) && (
          <Box mt={2}>
            <LinearProgress />
          </Box>
        )}

        {isEditMode && serviceCategories && (
          <Box mt={3}>
            <ServiceSubCategoryForm
              subCategory={serviceSubCategory}
              submitForm={subCategoryHandler}
              formErrors={updateFormErrors}
              cleanError={handleCleanError}
              cleanErrors={handleCleanErrors}
              serviceCategories={serviceCategories}
            />

            <Box mt={2} sx={{ width: `100%` }}>
              {!shouldShowSubCategoryForm && (
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  sx={{ width: `100%` }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        )}

        {!isEditMode && serviceSubCategory && serviceCategories && (
          <Box mt={3}>
            <SubCategoryDetails
              subCategory={serviceSubCategory}
              serviceCategories={serviceCategories}
              onEditClick={handleEditClick}
              onArchiveToggle={handleArchiveToggle}
              onDeactivateToggle={handleDeactivateToggle}
            />
          </Box>
        )}
      </Box>
    </PageContainer>
  );
}
