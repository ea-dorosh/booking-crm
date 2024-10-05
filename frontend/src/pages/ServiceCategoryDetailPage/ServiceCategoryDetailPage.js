/* eslint-disable no-unused-vars */
import EditIcon from "@mui/icons-material/Edit";
import { Button, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from "react-router-dom";
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

  const shouldShowCategoryForm = categoryId === `create-category`;

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

      <span onClick={()=> navigate(-1)}>Go back</span>

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
