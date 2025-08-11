import {
  Box,
  LinearProgress,
} from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import InvoicesContainer from "@/components/InvoicesContainer/InvoicesContainer";
import PageContainer from '@/components/PageContainer/PageContainer';
import {
  fetchInvoices,
} from '@/features/invoices/invoicesSlice';

export default function CustomersPage() {
  const dispatch = useDispatch();

  const invoices = useSelector(state => state.invoices.data);
  const { isPending } = useSelector(state => state.invoices);

  useEffect(() => {
    if (!invoices) {
      dispatch(fetchInvoices());
    }
  }, []);

  return (
    <PageContainer pageTitle="Invoices">

      {isPending && <Box mt={2}>
        <LinearProgress />
      </Box>}

      {invoices && invoices.length > 0 && <InvoicesContainer
        invoices={invoices}
      />}
    </PageContainer>
  );
}
