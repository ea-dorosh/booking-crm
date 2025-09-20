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
import Loader from '@/components/Loader/Loader';
import PageContainer from '@/components/PageContainer/PageContainer';
import PdfViewer from '@/components/PdfViewer/PdfViewer';
import { serviceStatusEnum } from '@/enums/enums';
import { sortedByLastActivityDateCustomers } from '@/features/customers/customersSelectors';
import { fetchCustomers } from "@/features/customers/customersSlice";
import {
  fetchInvoice,
  resetInvoiceData,
  updateInvoice,
  cleanError,
  cleanErrors,
  removeServiceErrorIndex,
} from "@/features/invoices/invoiceSlice";
import { fetchServices } from "@/features/services/servicesSlice";
import { usePdfHandler } from '@/hooks/usePdfHandler';

export default function CustomerDetailPage() {
  const { invoiceId } = useParams();
  const isNewInvoice = useMemo(() => invoiceId === `create-invoice`, [invoiceId]);
  const [isEditMode, setIsEditMode] = useState(isNewInvoice);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use PDF handler hook
  const {
    isPdfLoading,
    showPdfViewer,
    pdfViewerUrl,
    handleDownloadPdf,
    handleViewPdf,
    closePdfViewer,
  } = usePdfHandler(invoiceId);

  const {
    data: invoice, isPending, updateFormPending,
  } = useSelector(state => state.invoice);
  const { isPending: isCustomersRequestPending } = useSelector(state => state.customers);

  const customers = useSelector(sortedByLastActivityDateCustomers);
  const services = useSelector(state => state.services.data);

  const formErrors = useSelector(state => state.invoice.updateFormErrors);

  useEffect(() => {

    if (!isEditMode) {
      dispatch(fetchInvoice(invoiceId));
    } else {
      dispatch(fetchCustomers());
      dispatch(fetchServices([serviceStatusEnum.active]));
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

  const changeInvoiceHandler = async () => {
    const promise = Promise.all([
      dispatch(fetchCustomers()),
      dispatch(fetchServices([serviceStatusEnum.active])),
    ]);

    await promise;

    setIsEditMode(true);
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



  return (
    <PageContainer
      pageTitle={invoice ?
        `Invoice: ${invoice.invoiceNumber}` :
        `New invoice`
      }
      hideSideNav
    >
      {!isEditMode && <GoBackNavigation />}

      {(isPending || isCustomersRequestPending) &&
      <Box
        mt={2}
      >
        <LinearProgress />
      </Box>}

      <Loader
        isOpen={isPdfLoading}
        message={`Processing PDF...`}
      />

      {isEditMode && customers?.length > 0 && services?.length > 0 &&
      <Box
        mt={3}
      >
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

        <Box
          mt={2}
          sx={{ width:`100%` }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              if (isNewInvoice) {
                navigate(`/invoices`, { replace: true });
              } else {
                setIsEditMode(false)
              }
            }
            }
            sx={{ width:`100%` }}
            disabled={updateFormPending}
          >
            Cancel
          </Button>
        </Box>
      </Box>}

      {!isEditMode && invoice &&
      <Box
        mt={3}
      >
        <InvoiceDetails
          invoice={invoice}
          onChangeInvoiceClick={changeInvoiceHandler}
          onDownloadInvoiceClick={handleDownloadPdf}
          onViewInvoiceClick={handleViewPdf}
        />
      </Box>}

      <PdfViewer
        open={showPdfViewer}
        onClose={closePdfViewer}
        pdfUrl={pdfViewerUrl}
        invoiceId={invoiceId}
      />
    </PageContainer>
  );
}
