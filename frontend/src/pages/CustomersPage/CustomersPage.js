import {
  Box,
  LinearProgress,
} from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import CustomersContainer from "@/components/CustomersContainer/CustomersContainer";
import PageContainer from '@/components/PageContainer/PageContainer';
import { selectSortedCustomers } from '@/features/customers/customersSelectors';
import { fetchCustomers } from '@/features/customers/customersSlice';

export default function CustomersPage() {
  const dispatch = useDispatch();

  const customers = useSelector(selectSortedCustomers);
  const { isPending } = useSelector(state => state.customers);

  useEffect(() => {
    if (!customers || customers.length === 0) {
      dispatch(fetchCustomers());
    }
  }, []);

  return (
    <PageContainer
      pageTitle="Customers"
    >

      {isPending &&
      <Box mt={2}>
        <LinearProgress />
      </Box>}

      {customers && customers.length > 0 &&
      <CustomersContainer
        customers={customers}
      />}
    </PageContainer>
  );
}
