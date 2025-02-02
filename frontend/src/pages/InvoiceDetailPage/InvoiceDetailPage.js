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
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import InvoiceDetails from "@/components/InvoiceDetails/InvoiceDetails";
import InvoiceForm from "@/components/InvoiceForm/InvoiceForm";
import PageContainer from '@/components/PageContainer/PageContainer';
import { sortedByLastActivityDateCustomers } from '@/features/customers/customersSelectors';
import { fetchCustomers } from "@/features/customers/customersSlice";
import {
  fetchInvoice,
  resetInvoiceData,
  updateInvoice,
  cleanError,
  cleanErrors,
  removeServiceErrorIndex,
  downloadInvoicePdf,
} from "@/features/invoices/invoiceSlice";
import { fetchServices } from "@/features/services/servicesSlice";

export default function CustomerDetailPage() {
  const { invoiceId } = useParams();
  const isNewInvoice = useMemo(() => invoiceId === `create-invoice`, [invoiceId]);
  const [isEditMode, setIsEditMode] = useState(isNewInvoice);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {data: invoice, isPending, updateFormPending } = useSelector(state => state.invoice);
  const { isPending: isCustomersRequestPending} = useSelector(state => state.customers);

  const customers = useSelector(sortedByLastActivityDateCustomers);
  const services = useSelector(state => state.services.data);

  const formErrors = useSelector(state => state.invoice.updateFormErrors);

  useEffect(() => {
    if (!isEditMode) {
      dispatch(fetchInvoice(invoiceId));
    } else {
      dispatch(fetchCustomers());
      dispatch(fetchServices());
    }

    return () => {
      dispatch(resetInvoiceData());
    };
  }, []);

  const updateHandler = async (invoice) => {
    try {
      const response = await dispatch(updateInvoice(invoice)).unwrap();

      setIsEditMode(false);

      if (isNewInvoice) {
        navigate(`/invoices/${response.data}`, { replace: true });
      }

      dispatch(fetchInvoice(response.data));
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

  const handleRemoveServiceErrorIndex = (index) => {
    dispatch(removeServiceErrorIndex(index));
  };

  const handleDownloadInvoicePdf = async () => {
    // const response = await dispatch(downloadInvoicePdf(invoiceId)).unwrap();

    // const file = new Blob([response], { type: 'application/pdf' });

    // const fileURL = URL.createObjectURL(file);
    // const link = document.createElement('a');
    // link.href = fileURL;
    // link.target = `_blank`;
    // link.setAttribute('download', `invoice-${invoiceId}.pdf`);
    // document.body.appendChild(link);
    // link.click();
    // link.remove();
    // URL.revokeObjectURL(fileURL);

    const blobResponse = await dispatch(downloadInvoicePdf(invoiceId)).unwrap();

    const fileURL = URL.createObjectURL(
      new Blob([blobResponse], { type: 'application/pdf' })
    );

    const link = document.createElement('a');
    link.href = fileURL;
    link.target = '_blank';
    link.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileURL);
  };


  return (
    <PageContainer
      pageTitle={invoice ?
        `Invoice: ${invoice.invoiceNumber}`: `New invoice`
      }
      hideSideNav
    >
      {!isEditMode && <GoBackNavigation />}

      {(isPending || isCustomersRequestPending) && <Box mt={2}>
        <LinearProgress />
      </Box>}

      {isEditMode && <Box mt={3}>
        <InvoiceForm
          invoice={invoice}
          customers={customers}
          services={services}
          submitForm={updateHandler}
          formErrors={formErrors?.validationErrors}
          cleanError={handleCleanError}
          cleanErrors={handleCleanErrors}
          removeServiceErrorIndex={handleRemoveServiceErrorIndex}
          isPending={updateFormPending}
        />

        <Box mt={2} sx={{width:`100%`}}>
          {<Button
            variant="outlined"
            onClick={() => {
              if (isNewInvoice) {
                navigate(`/invoices`, { replace: true });
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

      {!isEditMode && invoice && <Box mt={3}>
        <InvoiceDetails
          invoice={invoice}
          onChangeInvoiceClick={() => setIsEditMode(true)}
          onDownloadInvoiceClick={handleDownloadInvoicePdf}
        />
      </Box>}
    </PageContainer>
  );
}
