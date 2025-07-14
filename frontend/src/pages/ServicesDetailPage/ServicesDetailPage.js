import { Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Typography,
  List,
  LinearProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import ListItemText from "@/components/ListItemText/ListItemText";
import PageContainer from '@/components/PageContainer/PageContainer';
import ServiceForm from "@/components/ServiceForm/ServiceForm";
import { fetchEmployees } from '@/features/employees/employeesSlice';
import {
  fetchServices,
  updateService,
  cleanError,
  cleanErrors,
  deleteService,
} from '@/features/services/servicesSlice';
import { fetchServiceSubCategories } from '@/features/serviceSubCategories/serviceSubCategoriesSlice';

export default function ServicesDetailPage() {
  const [isEditMode, setIsEditMode] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const shouldShowServiceForm = serviceId === `create-service`;

  const service = useSelector(state => state.services.data?.find(service => service.id === Number(serviceId)));
  const employees = useSelector(state => state.employees.data);
  const {
    updateFormErrors,
    isServicesRequestPending,
    isUpdateServiceRequestPending,
  } = useSelector(state => state.services);

  const serviceSubCategories = useSelector(state => state.serviceSubCategories.data);

  useEffect(() => {
    const promises = [];

    if (!serviceSubCategories) {
      promises.push(dispatch(fetchServiceSubCategories()));
    }

    if (!employees.length) {
      promises.push(dispatch(fetchEmployees()));
    }

    if (!service && !shouldShowServiceForm) {
      promises.push(dispatch(fetchServices()));
    } else if (shouldShowServiceForm) {
      dispatch(cleanErrors());
      setIsEditMode(true)
    }

    Promise.all(promises);
  }, []);

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  };

  const updateServiceHandler = async (service) => {
    try {
      const serviceId = await dispatch(updateService(service)).unwrap();

      // Clear errors on successful update
      dispatch(cleanErrors());

      if (!service.id) {
        navigate(`/services/${serviceId}`);
      }

      dispatch(fetchServices());

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

  const onDeleteServiceClick = async () => {
    await dispatch(deleteService(service.id)).unwrap();
    await dispatch(fetchServices()).unwrap();

    navigate(`/services`);
  };

  return (
    <PageContainer
      pageTitle={service ?
        `${service.name}`
        :
        `New Service`
      }
      hideSideNav
    >
      <GoBackNavigation />

      {(isUpdateServiceRequestPending || isServicesRequestPending) && <Box mt={2}>
        <LinearProgress />
      </Box>}

      {isEditMode && serviceSubCategories && <Box mt={3}>
        <ServiceForm
          employees={employees || []}
          service={service}
          serviceSubCategories={serviceSubCategories}
          createNewService={updateServiceHandler}
          formErrors={updateFormErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
        />

        <Box mt={2} sx={{width:`100%`}}>
          {!shouldShowServiceForm && <Button
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

      {!isEditMode && service && serviceSubCategories && <Box mt={3}>
        <List>
          <ListItemText
            value={service.name}
            label="Service Name"
          />

          <ListItemText
            value={serviceSubCategories.find(subCategory => subCategory.id === service.subCategoryId).name || `-`}
            label="Service Sub Category"
          />

          <ListItemText
            value={service.durationTime}
            label="Duration Time"
          />

          <ListItemText
            value={service.bufferTime || `-`}
            label="Buffer Time"
          />

          <ListItemText
            value={service.bookingNote || `-`}
            label="Note"
          />

          <Box sx={{marginTop: `20px`}}>
            <Typography>
              This service is provided by the following masters:
            </Typography>

            <List>
              {service.employeePrices.map((employeePrice) => (
                <ListItemText
                  key={employeePrice.employeeId}
                  value={getEmployeeName(employeePrice.employeeId)}
                  label={employeePrice.price}
                />
              ))}
            </List>
          </Box>

          <Button
            startIcon={<EditIcon />}
            onClick={() => {
              dispatch(cleanErrors());
              setIsEditMode(true);
            }}
            variant="outlined"
          >
            Update
          </Button>
        </List>
      </Box>}
    </PageContainer>
  );
}
