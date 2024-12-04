import EditIcon from "@mui/icons-material/Edit";
import {
  Box, 
  Button, 
  List,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import {
  useState, 
  useEffect,
  useMemo,
} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import CustomerForm from "@/components/CustomerForm/CustomerForm";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import { 
  fetchCustomer,
  updateCustomer,
  resetCustomerData,
  cleanError,
  cleanErrors,
} from "@/features/customers/customerSlice";

export default function CustomerDetailPage() {
  const { customerId } = useParams();

  const isNewCustomer = useMemo(() => customerId === `create-customer`, [customerId]);

  const [isEditMode, setIsEditMode] = useState(isNewCustomer);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {data: customer, isPending, updateFormPending } = useSelector(state => state.customer);

  const formErrors = useSelector(state => state.customer.updateFormErrors);

  useEffect(() => {    
    if (!isEditMode) {
      dispatch(fetchCustomer(customerId));
    }

    return () => {
      dispatch(resetCustomerData());
    };
  }, []);

  const updateHandler = async (customer) => {   
    try {
      const response = await dispatch(updateCustomer(customer)).unwrap();
      
      setIsEditMode(false);

      if (isNewCustomer) {
        navigate(`/customers/${response.data}`, { replace: true });
      }

      dispatch(fetchCustomer(response.data));
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
      pageTitle={customer ? 
        `${customer.lastName} ${customer.firstName}`: `New Customer`
      }
      hideSideNav
    >
      {!isEditMode && <GoBackNavigation />}

      {isPending && <Box mt={2}>
        <LinearProgress />
      </Box>}

      {isEditMode && <Box mt={3}>
        <CustomerForm
          customer={customer}
          submitForm={updateHandler}
          formErrors={formErrors?.validationErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
          isPending={updateFormPending}
        />

        <Box mt={2} sx={{width:`100%`}}>
          {<Button 
            variant="outlined"
            onClick={() => {
              if (isNewCustomer) {
                navigate(`/customers`, { replace: true });
              } else {
                setIsEditMode(false)
              }
            }
            }
            sx={{width:`100%`}}
            disabled={updateFormPending}
          >
            Cancel
          </Button>}
        </Box>
      </Box>}

      {!isEditMode && customer && <Box mt={3}>
        <List>
          <ListItemText
            primary={`${customer.lastName} ${customer.firstName}`}
            secondary="Name"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={customer.email}
            secondary="Email"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={customer.phone || `-`}
            secondary="Phone"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <ListItemText
            primary={customer.addedDate || `-`}
            secondary="Added"
            sx={{ 
              flex: `0 0 200px`,
              display: `flex`,
              flexDirection: `column-reverse`,
            }}
          />

          <Button
            startIcon={<EditIcon />}
            onClick={() => setIsEditMode(true)}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Change Customer Details
          </Button>
        </List>
      </Box>}
    </PageContainer>
  );
}
