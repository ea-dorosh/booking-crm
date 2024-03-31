import EditIcon from "@mui/icons-material/Edit";
import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from "react-router-dom";
import CreateServiceForm from "@/components/CreateServiceForm";
import PageContainer from '@/components/PageContainer/PageContainer';
import { fetchEmployees } from '@/features/employees/employeesSlice';
import { 
  fetchServices,
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

  const shouldShowCreateServiceForm = serviceId === `create-service`;

  useEffect(() => {
    if (!employees.length) {
      dispatch(fetchEmployees());
    }

    if (!service && !shouldShowCreateServiceForm) {
      dispatch(fetchServices());
    } else if (shouldShowCreateServiceForm) {
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
        <CreateServiceForm
          employees={employees || []}
          service={service}
          createNewService={updateServiceHandler}
          formErrors={formErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
        />

        <Box mt={2} sx={{width:`100%`}}>
          {!shouldShowCreateServiceForm && <Button 
            variant="outlined"
            onClick={() => setIsEditMode(false)}
            sx={{width:`100%`}}
          >
            Cancel
          </Button>}
        </Box>

        <Box sx={{ width: `100%` }}>
          <Button 
            variant="outlined"
            onClick={onDeleteServiceClick}
            sx={{width:`100%`}}
          >
            Delete Service
          </Button>
        </Box>
      </Box>}

      {!isEditMode && service && <Box mt={3}>
        <List>
          <ListItemText
            primary={service.name}
            sx={{ flex: `0 0 200px` }}
          />

          <ListItemText
            primary={service.durationTime}
            sx={{ flex: `0 0 200px` }}
          />

          <ListItemText
            primary={service.bufferTime}
            sx={{ flex: `0 0 200px` }}
          />

          <ListItemButton
            sx={{ padding: `0` }}
            onClick={() => {
              setIsEditMode(true);
            }}
          >
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
          </ListItemButton>
        </List>
      </Box>}
    </PageContainer>
  );
}
