/* eslint-disable no-unused-vars */
import {
  Box, 
  Button, 
  LinearProgress,
} from "@mui/material";
import {
  useState, 
  useEffect,
  useMemo,
} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import CustomerDetails from "@/components/CustomerDetails/CustomerDetails";
import CustomerForm from "@/components/CustomerForm/CustomerForm";
import CustomerSavedAppointments from "@/components/CustomerSavedAppointments/CustomerSavedAppointments";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import PageContainer from '@/components/PageContainer/PageContainer';
import { 
  fetchCustomer,
  fetchCustomerAppointments,
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

  const {data: customer, isPending, updateFormPending, savedAppointments, isSavedAppointmentsPending } = useSelector(state => state.customer);

  const formErrors = useSelector(state => state.customer.updateFormErrors);

  useEffect(() => {    
    if (!isEditMode) {
      dispatch(fetchCustomer(customerId));
      dispatch(fetchCustomerAppointments(customerId));
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

      {(isPending || isSavedAppointmentsPending) && <Box mt={2}>
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
        <CustomerDetails 
          customer={customer}
          onChangeCustomerClick={() => setIsEditMode(true)}
        />
      </Box>}

      {!isEditMode && savedAppointments && <Box mt={3}>
        <CustomerSavedAppointments 
          appointments={savedAppointments}
        />
      </Box>}
    </PageContainer>
  );
}
