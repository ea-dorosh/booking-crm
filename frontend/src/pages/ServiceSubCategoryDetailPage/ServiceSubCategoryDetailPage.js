import {
  Box,
  LinearProgress,
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
      promises.push(dispatch(fetchServiceCategories([`all`])));
    }

    if (!serviceSubCategory && !shouldShowSubCategoryForm) {
      promises.push(fetchUpdatedSubCategories());
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

  const fetchUpdatedSubCategories = async () => {
    const storedStatus = sessionStorage.getItem(`subCategoriesStatusFilter`);
    const statuses = storedStatus ? [storedStatus] : [subCategoryStatusEnum.active];

    await dispatch(fetchServiceSubCategories(statuses));
  }

  const subCategoryHandler = async (subCategory) => {
    try {
      const subCategoryId = await dispatch(updateSubCategory(subCategory)).unwrap();

      // Clear errors on successful update
      dispatch(cleanErrors());

      navigate(`/sub-categories/${subCategoryId}`, { replace: true });

      await fetchUpdatedSubCategories();
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
      id: serviceSubCategory.id,
      status: nextStatus,
    }));
    await dispatch(fetchServiceSubCategories([`all`]));
  };

  const handleDeactivateToggle = async () => {
    if (!serviceSubCategory) return;
    const isDisabled = String(serviceSubCategory.status).toLowerCase() === subCategoryStatusEnum.disabled;
    const nextStatus = isDisabled ? subCategoryStatusEnum.active : subCategoryStatusEnum.disabled;

    await dispatch(updateSubCategory({
      id: serviceSubCategory.id,
      status: nextStatus,
    }));
    await dispatch(fetchServiceSubCategories([`all`]));
  };

  return (
    <PageContainer
      pageTitle={getPageTitle()}
      hideSideNav
    >
      <Box
        sx={{
          padding: {
            xs: 0,
            md: 0,
            maxWidth: `768px`,
          },
        }}
      >
        {!isEditMode && <GoBackNavigation beforeGoBack={fetchUpdatedSubCategories} />}

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
              onCancelEdit={handleCancelEdit}
              serviceCategories={serviceCategories}
            />
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
