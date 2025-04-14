import {
  Box,
  Button,
  LinearProgress,
} from "@mui/material";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from "react-router-dom";
import GoBackNavigation from '@/components/GoBackNavigation/GoBackNavigation';
import InvoiceDetails from "@/components/InvoiceDetails/InvoiceDetails";
import InvoiceForm from "@/components/InvoiceForm/InvoiceForm";
import Loader from '@/components/Loader/Loader';
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
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const iframeRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {data: invoice, isPending, updateFormPending } = useSelector(state => state.invoice);
  const { isPending: isCustomersRequestPending} = useSelector(state => state.customers);

  const customers = useSelector(sortedByLastActivityDateCustomers);
  const services = useSelector(state => state.services.data);

  const formErrors = useSelector(state => state.invoice.updateFormErrors);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent =
        typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      setIsMobileDevice(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    if (!isEditMode) {
      dispatch(fetchInvoice(invoiceId));
    } else {
      dispatch(fetchCustomers());
      dispatch(fetchServices());
    }

    return () => {
      dispatch(resetInvoiceData());
      if (pdfViewerUrl) {
        URL.revokeObjectURL(pdfViewerUrl);
      }
      window.removeEventListener("resize", checkMobile);
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
    try {
      setIsPdfLoading(true);
      const blobResponse = await dispatch(downloadInvoicePdf(invoiceId)).unwrap();

      const fileURL = URL.createObjectURL(
        new Blob([blobResponse], { type: 'application/pdf' })
      );

      const link = document.createElement('a');
      link.href = fileURL;
      link.target = `_blank`;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error(`Failed to download PDF`, error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleViewInvoicePdf = async () => {
    try {
      setIsPdfLoading(true);
      const blobResponse = await dispatch(downloadInvoicePdf(invoiceId)).unwrap();

      // Clear previous URL if it exists
      if (pdfViewerUrl) {
        URL.revokeObjectURL(pdfViewerUrl);
      }

      // Create a blob with the correct MIME type
      const blob = new Blob([blobResponse], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blob);

      if (isMobileDevice) {
        // On mobile, we directly download or open in a new window
        window.open(fileURL, `_blank`);
        setIsPdfLoading(false);
      } else {
        // On desktop, show in iframe
        setPdfViewerUrl(fileURL);
        setShowPdfViewer(true);
        setIsPdfLoading(false);
      }
    } catch (error) {
      console.error(`Failed to view PDF`, error);
      setIsPdfLoading(false);
    }
  };

  const closePdfViewer = () => {
    if (pdfViewerUrl) {
      URL.revokeObjectURL(pdfViewerUrl);
    }
    setPdfViewerUrl(null);
    setShowPdfViewer(false);
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

      <Loader isOpen={isPdfLoading} message={`Processing PDF...`} />

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
          onViewInvoiceClick={handleViewInvoicePdf}
        />
      </Box>}

      {showPdfViewer && (
        <Box
          sx={{
            position: `fixed`,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(0,0,0,0.7)`,
            zIndex: 1300,
            display: `flex`,
            flexDirection: `column`,
            alignItems: `center`,
            padding: 2
          }}
        >
          <Box sx={{
            display: `flex`,
            justifyContent: `flex-end`,
            width: `100%`,
            marginBottom: 1
          }}>
            <Button
              variant="contained"
              color="primary"
              onClick={closePdfViewer}
            >
              Close
            </Button>
          </Box>
          <Box sx={{
            width: `100%`,
            height: `calc(100% - 50px)`,
            backgroundColor: `white`,
            overflow: `hidden`
          }}>
            {pdfViewerUrl && (
              <iframe
                ref={iframeRef}
                src={pdfViewerUrl}
                width="100%"
                height="100%"
                title="Invoice PDF"
                frameBorder="0"
                allowFullScreen
              />
            )}
          </Box>
        </Box>
      )}
    </PageContainer>
  );
}
