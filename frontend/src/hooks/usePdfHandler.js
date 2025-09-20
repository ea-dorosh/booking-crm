import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { downloadInvoicePdf } from '@/features/invoices/invoiceSlice.js';
import {
  checkIsMobileDevice,
  downloadPdfFile,
  openMobilePdfPreview,
} from '@/utils/pdfUtils.js';

/**
 * Custom hook for handling PDF operations
 */
export const usePdfHandler = (invoiceId) => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const dispatch = useDispatch();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(checkIsMobileDevice());
    };

    checkMobile();
    window.addEventListener(`resize`, checkMobile);

    return () => {
      window.removeEventListener(`resize`, checkMobile);
    };
  }, []);

  // Clean up PDF viewer URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfViewerUrl) {
        URL.revokeObjectURL(pdfViewerUrl);
      }
    };
  }, [pdfViewerUrl]);

  /**
   * Handle PDF download
   */
  const handleDownloadPdf = useCallback(async () => {
    try {
      setIsPdfLoading(true);
      const blobResponse = await dispatch(downloadInvoicePdf(invoiceId)).unwrap();
      const blob = new Blob([blobResponse], { type: `application/pdf` });

      await downloadPdfFile(blob, `invoice-${invoiceId}.pdf`, isMobileDevice);
    } catch (error) {
      console.error(`Failed to download PDF`, error);
      alert(`Failed to download PDF. Please try again.`);
    } finally {
      setIsPdfLoading(false);
    }
  }, [dispatch, invoiceId, isMobileDevice]);

  /**
   * Handle PDF preview
   */
  const handleViewPdf = useCallback(async () => {
    try {
      setIsPdfLoading(true);
      const blobResponse = await dispatch(downloadInvoicePdf(invoiceId)).unwrap();

      // Clear previous URL if it exists
      if (pdfViewerUrl) {
        URL.revokeObjectURL(pdfViewerUrl);
      }

      const blob = new Blob([blobResponse], { type: `application/pdf` });
      const fileURL = URL.createObjectURL(blob);

      if (isMobileDevice) {
        // Use mobile-friendly preview
        const success = openMobilePdfPreview(blob, invoiceId);
        if (!success) {
          // Fallback already handled in openMobilePdfPreview
        }
      } else {
        // Desktop: show in iframe
        setPdfViewerUrl(fileURL);
        setShowPdfViewer(true);
      }
    } catch (error) {
      console.error(`Failed to view PDF`, error);
      alert(`Failed to load PDF preview. Please try again.`);
    } finally {
      setIsPdfLoading(false);
    }
  }, [dispatch, invoiceId, isMobileDevice, pdfViewerUrl]);

  /**
   * Close PDF viewer
   */
  const closePdfViewer = useCallback(() => {
    if (pdfViewerUrl) {
      URL.revokeObjectURL(pdfViewerUrl);
    }
    setPdfViewerUrl(null);
    setShowPdfViewer(false);
  }, [pdfViewerUrl]);

  return {
    isPdfLoading,
    showPdfViewer,
    pdfViewerUrl,
    isMobileDevice,
    handleDownloadPdf,
    handleViewPdf,
    closePdfViewer,
  };
};
