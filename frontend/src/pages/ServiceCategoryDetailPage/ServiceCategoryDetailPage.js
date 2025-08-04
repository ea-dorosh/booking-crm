import {
  Box,
  LinearProgress,
  Button,
  List,
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
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import ListItemText from '@/components/ListItemText/ListItemText';
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

  return (
    <PageContainer
      pageTitle={serviceCategory ?
        `${serviceCategory.name}`
        :
        `New Category`
      }
      hideSideNav
    >
      <Box sx={{ padding: { xs: 0, md: 0 } }}>
        {!isEditMode && <GoBackNavigation />}

        {(isUpdateCategoryRequestPending || areCategoriesFetching) && <Box mt={2}>
          <LinearProgress />
        </Box>}

        {isEditMode && <Box mt={3}>
          <ServiceCategoryForm
            category={serviceCategory}
            submitForm={categoryHandler}
            formErrors={updateFormErrors}
            cleanError={handleCleanError}
            cleanErrors={handleCleanErrors}
          />

          <Box mt={2} sx={{width:`100%`}}>
            {!shouldShowCategoryForm && <Button
              variant="outlined"
              onClick={() => {
                dispatch(cleanErrors());
                setIsEditMode(false);
              }}
              sx={{width:`100%`}}
            >
              Cancel
            </Button>}
          </Box>
        </Box>}

        {!isEditMode && serviceCategory && <Box mt={3}>
          <List>
            <ListItemText
              value={serviceCategory.name}
              label="Category Name"
            />

            <ListItemText
              value={serviceCategory.status}
              label="Status"
            />

            {serviceCategory.image && (
              <ListItemText
                value=""
                label="Image"
                image={serviceCategory.image}
              />
            )}

            <Button
              variant="outlined"
              onClick={() => {
                dispatch(cleanErrors());
                setIsEditMode(true);
              }}
            >
              Update
            </Button>
          </List>
        </Box>}
      </Box>
    </PageContainer>
  );
}
