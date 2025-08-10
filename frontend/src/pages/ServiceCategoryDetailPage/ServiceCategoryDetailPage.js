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
import CategoryDetails from '../../components/CategoryDetails/CategoryDetails';
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import ServiceCategoryForm from "@/components/ServiceCategoryForm/ServiceCategoryForm";
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
      dispatch(fetchServiceCategories());
    } else if (shouldShowCategoryForm) {
      dispatch(cleanErrors());
      setIsEditMode(true);
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

  const handleArchive = async () => {
    if (!serviceCategory) return;
    await dispatch(updateCategory({ id: serviceCategory.id, status: 'archived' }));
    await dispatch(fetchServiceCategories());
    navigate('/services?tab=categories');
  };

  return (
    <PageContainer pageTitle={getPageTitle()} hideSideNav>
      <Box sx={{ padding: { xs: 0, md: 0 } }}>
        {!isEditMode && <GoBackNavigation />}

        {(isUpdateCategoryRequestPending || areCategoriesFetching) && (
          <Box mt={2}>
            <LinearProgress />
          </Box>
        )}

        {isEditMode && (
          <Box mt={3}>
            <ServiceCategoryForm
              category={serviceCategory}
              submitForm={categoryHandler}
              formErrors={updateFormErrors}
              cleanError={handleCleanError}
              cleanErrors={handleCleanErrors}
            />

            <Box mt={2} sx={{ width: `100%` }}>
              {!shouldShowCategoryForm && (
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

        {!isEditMode && serviceCategory && (
          <Box mt={3}>
            <CategoryDetails
              category={serviceCategory}
              onEditClick={handleEditClick}
              onArchiveClick={handleArchive}
            />
          </Box>
        )}
      </Box>
    </PageContainer>
  );
}
