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
import CategoryDetails from '../../components/CategoryDetails/CategoryDetails';
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServiceCategoryForm from "@/components/ServiceCategoryForm/ServiceCategoryForm";
import { categoryStatusEnum } from '@/enums/enums';
import {
  fetchServiceCategories,
  updateCategory,
  cleanError,
  cleanErrors,
} from '@/features/serviceCategories/serviceCategoriesSlice';

export default function ServiceCategoryDetailPage() {
  const [isEditMode, setIsEditMode] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const shouldShowCategoryForm = categoryId === `create-category`;

  const serviceCategory = useSelector(state => state.serviceCategories.data?.find(category => category.id === Number(categoryId)));
  const {
    areCategoriesFetching,
    isUpdateCategoryRequestPending,
    updateFormErrors,
  } = useSelector(state => state.serviceCategories);

  useEffect(() => {
    if (!serviceCategory && !shouldShowCategoryForm) {
      fetchUpdatedCategories();
    } else if (shouldShowCategoryForm) {
      dispatch(cleanErrors());
      setIsEditMode(true);
    }

    // Clean errors when component unmounts
    return () => {
      dispatch(cleanErrors());
    };
  }, []);

  const fetchUpdatedCategories = async () => {
    const storedStatus = sessionStorage.getItem(`categoriesStatusFilter`);
    const statuses = storedStatus ? [storedStatus] : [categoryStatusEnum.active];

    await dispatch(fetchServiceCategories(statuses));
  }

  const onSubmitForm = async (category) => {
    try {
      const categoryId = await dispatch(updateCategory(category)).unwrap();

      // Clear errors on successful update
      dispatch(cleanErrors());

      navigate(`/categories/${categoryId}`, { replace: true });

      dispatch(fetchServiceCategories());
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
    if (isEditMode) return serviceCategory ? `Edit ${serviceCategory.name}` : `New Category`;
    return serviceCategory ? serviceCategory.name : `New Category`;
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
    if (!serviceCategory) return;
    const isArchived = serviceCategory.status === categoryStatusEnum.archived;
    const nextStatus = isArchived ? categoryStatusEnum.active : categoryStatusEnum.archived;

    await dispatch(updateCategory({
      id: serviceCategory.id,
      status: nextStatus,
    }));

    await dispatch(fetchServiceCategories([`all`]))
  };

  const handleDeactivateToggle = async () => {
    if (!serviceCategory) return;
    const isDisabled = serviceCategory.status === categoryStatusEnum.disabled;
    const nextStatus = isDisabled ? categoryStatusEnum.active : categoryStatusEnum.disabled;

    await dispatch(updateCategory({
      id: serviceCategory.id,
      status: nextStatus,
    }));

    await dispatch(fetchServiceCategories([`all`]))
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
        {!isEditMode && <GoBackNavigation
          beforeGoBack={fetchUpdatedCategories} />}

        {(isUpdateCategoryRequestPending || areCategoriesFetching) && (
          <Box
            mt={2}>
            <LinearProgress />
          </Box>
        )}

        {isEditMode && (
          <Box
            mt={3}>
            <ServiceCategoryForm
              category={serviceCategory}
              submitForm={onSubmitForm}
              formErrors={updateFormErrors}
              cleanError={handleCleanError}
              cleanErrors={handleCleanErrors}
              onCancelEdit={handleCancelEdit}
            />
          </Box>
        )}

        {!isEditMode && serviceCategory && (
          <Box mt={3}>
            <CategoryDetails
              category={serviceCategory}
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
