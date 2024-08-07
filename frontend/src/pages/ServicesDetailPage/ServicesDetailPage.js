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
import ServiceForm from "@/components/ServiceForm/ServiceForm";
import { 
  fetchEmployees,
  selectEmployeeNameById,
} from '@/features/employees/employeesSlice';
import {
  fetchServices,
  fetchServiceCategories,
  updateService,
  cleanError,
  cleanErrors,
  resetUpdateFormStatus,
  deleteService,
  resetDeleteServiceStatus,
} from '@/features/services/servicesSlice';

export default function ServicesDetailPage() {
  const [isEditMode, setIsEditMode] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const service = useSelector(state => state.services.data.find(service => service.id === Number(serviceId)));
  const employees = useSelector(state => state.employees.data);
  const formErrors = useSelector(state => state.services.updateFormErrors);
  const updateFormStatus = useSelector(state => state.services.updateFormStatus);
  const deleteServiceStatus = useSelector(state => state.services.deleteServiceStatus);
  const newServiceId = useSelector(state => state.services.updateFormData);
  const state = useSelector(state => state);
  const serviceCategories = useSelector(state => state.services.serviceCategories);
  console.log(`serviceCategories`, serviceCategories);
  const shouldShowServiceForm = serviceId === `create-service`;

  useEffect(() => {
    console.log(`useEffect, dispatch(fetchServiceCategories());
    `);
    dispatch(fetchServiceCategories());

    if (!employees.length) {
      dispatch(fetchEmployees());
    }

    if (!service && !shouldShowServiceForm) {
      dispatch(fetchServices());
    } else if (shouldShowServiceForm) {
      setIsEditMode(true)
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (deleteServiceStatus === `succeeded`) {
        await dispatch(fetchServices());
        dispatch(resetDeleteServiceStatus());
        navigate(`/services`);
      }
    })();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteServiceStatus]);

  useEffect(() => {
    (async () => {
      if (updateFormStatus === `succeeded`) {
        await dispatch(fetchServices());
        setIsEditMode(false);
        dispatch(resetUpdateFormStatus());

        if (newServiceId) {
          navigate(`/services/${newServiceId}`);
        }
      }
    })();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFormStatus]);

  const updateServiceHandler = (service) => {
    dispatch(updateService(service));
  };

  const handleCleanError = (fieldName) => {
    dispatch(cleanError(fieldName));
  };

  const handleCleanErrors = () => {
    dispatch(cleanErrors());
  };

  const onDeleteServiceClick = () => {
    dispatch(deleteService(service.id));
  };

  return (
    <PageContainer 
      pageTitle={service ? 
        `Details for ${service.name}` 
        :
        `New Service`
      }
      hideSideNav
    >
      <Link to={`/services`}>Go back</Link>

      <Divider />

      {isEditMode && <Box mt={3}>
        <ServiceForm
          employees={employees || []}
          service={service}
          serviceCategories={serviceCategories}
          createNewService={updateServiceHandler}
          formErrors={formErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
        />

        <Box mt={2} sx={{width:`100%`}}>
          {!shouldShowServiceForm && <Button 
            variant="outlined"
            onClick={() => setIsEditMode(false)}
            sx={{width:`100%`}}
          >
            Cancel
          </Button>}
        </Box>

        <Box mt={2} sx={{ width: `100%` }}>
          <Button 
            variant="outlined"
            onClick={onDeleteServiceClick}
            sx={{width:`100%`}}
            color="error"
          >
            Delete Service
          </Button>
        </Box>
      </Box>}

      {!isEditMode && service && serviceCategories && <Box mt={3}>
        <List>
          <ListItemText
            primary={service.name}
            secondary="Service Name"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={serviceCategories.find(category => category.id === service.categoryId).name || `-`}
            secondary="Service Category"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={service.durationTime}
            secondary="Duration Time"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={service.bufferTime || `-`}
            secondary="Buffer Time"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={service.bookingNote || `-`}
            secondary="Note"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <Box sx={{marginTop: `20px`}}>
            <Typography>
              This service is provided by the following masters:
            </Typography>

            <List>
              {service.employeePrices.map((employeePrice) => (
                <ListItemText
                  key={employeePrice.employeeId}
                  primary={selectEmployeeNameById(state, employeePrice.employeeId)}
                  secondary={employeePrice.price}
                  sx={{ flex: `0 0 200px` }}
                />
              ))}
            </List>
          </Box>

          <Button
            startIcon={<EditIcon />}
            onClick={() => setIsEditMode(true)}
            variant="outlined"
          >
            Update
          </Button>
        </List>
      </Box>}
    </PageContainer>
  );
}
