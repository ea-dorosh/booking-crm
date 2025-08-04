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
import ServiceSubCategoryForm from "@/components/ServiceSubCategoryForm/ServiceSubCategoryForm";
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
      promises.push(dispatch(fetchServiceSubCategories()));
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

  return (
    <PageContainer
      pageTitle={serviceSubCategory ?
        `${serviceSubCategory.name}`
        :
        `New Sub Category`
      }
      hideSideNav
    >
      <Box sx={{ padding: { xs: 0, md: 0 } }}>
        {!isEditMode && <GoBackNavigation />}

        {(isUpdateSubCategoryRequestPending || areSubCategoriesFetching) && <Box mt={2}>
          <LinearProgress />
        </Box>}

        {isEditMode && serviceCategories && <Box mt={3}>
          <ServiceSubCategoryForm
            subCategory={serviceSubCategory}
            submitForm={subCategoryHandler}
            formErrors={updateFormErrors}
            cleanError={handleCleanError}
            cleanErrors={handleCleanErrors}
            serviceCategories={serviceCategories}
          />

          <Box mt={2} sx={{width:`100%`}}>
            {!shouldShowSubCategoryForm && <Button
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

        {!isEditMode && serviceSubCategory && serviceCategories && <Box mt={3}>
          <List>
            <ListItemText
              value={serviceSubCategory.name}
              label="Sub Category Name"
            />

            <ListItemText
              value={serviceCategories.find(cat => cat.id === serviceSubCategory.categoryId)?.name || `No category`}
              label="Category"
            />

            {serviceSubCategory.image && (
              <ListItemText
                value=""
                label="Image"
                image={serviceSubCategory.image}
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
