import { Close as CloseIcon } from '@mui/icons-material';
import { Dialog, DialogContent, DialogActions, Button, Box } from '@mui/material';
import React, { useRef, useEffect } from 'react';

/**
 * PDF Viewer Component for desktop preview
 */
const PdfViewer = ({
  open,
  onClose,
  pdfUrl,
  invoiceId,
}) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (open && pdfUrl && iframeRef.current) {
      iframeRef.current.src = pdfUrl;
    }
  }, [open, pdfUrl]);

  const handleClose = () => {
    if (iframeRef.current) {
      iframeRef.current.src = ``;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: `90vh`,
          maxHeight: `90vh`,
        },
      }}
    >
      <DialogActions sx={{ padding: 1 }}>
        <Button
          onClick={handleClose}
          startIcon={<CloseIcon />}
          variant="outlined"
          size="small"
        >
          Close PDF
        </Button>
      </DialogActions>

      <DialogContent
        sx={{
          padding: 0,
          overflow: `hidden`,
        }}
      >
        <Box
          sx={{
            width: `100%`,
            height: `100%`,
            display: `flex`,
            justifyContent: `center`,
            alignItems: `center`,
          }}
        >
          {pdfUrl ? (
            <iframe
              ref={iframeRef}
              title={`Invoice ${invoiceId} PDF`}
              width="100%"
              height="100%"
              style={{ border: `none` }}
            />
          ) : (
            <Box
              sx={{
                textAlign: `center`,
                color: `text.secondary`,
              }}
            >
              Loading PDF...
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewer;
