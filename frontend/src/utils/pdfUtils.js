/**
 * Utilities for PDF handling on different devices
 */

/**
 * Check browser capabilities for PDF handling
 */
export const getBrowserCapabilities = () => {
  const canShare = navigator.share && navigator.canShare;
  const canDownload = `download` in document.createElement(`a`);
  const canOpenPopup = !/(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent) ||
                      window.innerWidth > 768;

  return {
    canShare,
    canDownload,
    canOpenPopup,
    supportsWebShare: canShare && typeof navigator.canShare === `function`,
  };
};

/**
 * Check if device is mobile
 */
export const checkIsMobileDevice = () => {
  const userAgent =
    typeof window.navigator === `undefined` ? `` : navigator.userAgent;
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTouchDevice = `ontouchstart` in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;

  // Consider it mobile if it has mobile user agent OR (is touch device AND small screen)
  return isMobileUserAgent || (isTouchDevice && isSmallScreen);
};

/**
 * Download PDF file with mobile-friendly approach
 */
export const downloadPdfFile = async (blob, filename, isMobile = false) => {
  const fileURL = URL.createObjectURL(blob);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isMobile) {
    const capabilities = getBrowserCapabilities();
    const file = new File([blob], filename, { type: `application/pdf` });

    // Try Web Share API first (works great on iOS)
    if (capabilities.supportsWebShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `PDF Document`,
          text: `PDF document`,
        });
        URL.revokeObjectURL(fileURL);
        return;
      } catch (error) {
        console.log(`Web Share failed, falling back to download`, error);
      }
    }

    // For iOS, use a different approach
    if (isIOS) {
      // On iOS, open the PDF directly - Safari will show share options
      const link = document.createElement(`a`);
      link.href = fileURL;
      link.target = `_blank`;
      link.rel = `noopener noreferrer`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up after delay
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 5000);

      return;
    }
  }

  // Fallback: traditional download approach
  const link = document.createElement(`a`);
  link.href = fileURL;
  link.download = filename;
  link.target = `_blank`;
  link.rel = `noopener noreferrer`;

  if (isMobile) {
    link.style.display = `none`;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    }, 100);

    // Show user-friendly message for mobile
    alert(`PDF will open in a new tab. Use your browser's share or download options to save it.`);
  } else {
    // Desktop behavior
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileURL);
  }
};

/**
 * Create mobile-friendly PDF viewer HTML content
 */
export const createMobilePdfViewerContent = (fileURL, invoiceId) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceId} - PDF Preview</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
          }
          .header {
            background: #fff;
            padding: 10px 15px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          .header h1 {
            margin: 0;
            font-size: 16px;
            color: #333;
          }
          .actions {
            display: flex;
            gap: 10px;
          }
          .btn {
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
          }
          .btn-primary {
            background: #007bff;
            color: white;
          }
          .btn-secondary {
            background: #6c757d;
            color: white;
          }
          .pdf-container {
            width: 100%;
            height: calc(100vh - 60px);
          }
          .pdf-embed {
            width: 100%;
            height: 100%;
            border: none;
          }
          .fallback {
            padding: 20px;
            text-align: center;
            background: white;
            margin: 20px;
            border-radius: 8px;
            display: none;
          }
          .fallback a {
            color: #007bff;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invoice ${invoiceId}</h1>
          <div class="actions">
            <a href="${fileURL}" download="invoice-${invoiceId}.pdf" class="btn btn-primary">Download</a>
            <button onclick="window.close()" class="btn btn-secondary">Close</button>
          </div>
        </div>
        <div class="pdf-container">
          <embed id="pdf-embed" src="${fileURL}" type="application/pdf" class="pdf-embed">
          <div id="fallback" class="fallback">
            <p>PDF preview not supported on this device.</p>
            <p><a href="${fileURL}" download="invoice-${invoiceId}.pdf">Click here to download the PDF</a></p>
          </div>
        </div>
        <script>
          // Check if PDF is supported
          const embed = document.getElementById('pdf-embed');
          const fallback = document.getElementById('fallback');

          embed.onload = function() {
            fallback.style.display = 'none';
          };

          embed.onerror = function() {
            embed.style.display = 'none';
            fallback.style.display = 'block';
          };

          // Auto-cleanup URL after 5 minutes
          setTimeout(() => {
            try {
              URL.revokeObjectURL('${fileURL}');
            } catch(e) {
              console.log('URL cleanup failed:', e);
            }
          }, 300000);
        </script>
      </body>
    </html>
  `;
};

/**
 * Convert Blob to data URL (base64) - useful for iOS Safari navigation
 */
export const blobToDataURL = (blob) => new Promise((resolve, reject) => {
  try {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  } catch (error) {
    reject(error);
  }
});

/**
 * Open PDF preview in mobile-friendly way
 */
export const openMobilePdfPreview = (blob, invoiceId) => {
  const fileURL = URL.createObjectURL(blob);

  // For iOS Safari, try a different approach
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // On iOS, directly open the PDF in a new tab
    // This works better than trying to create a custom viewer
    const link = document.createElement(`a`);
    link.href = fileURL;
    link.target = `_blank`;
    link.rel = `noopener noreferrer`;

    // Try to open in new tab
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 5000);

    return true;
  }

  // For other mobile devices, try popup first
  const newWindow = window.open(`about:blank`, `_blank`);

  if (newWindow && newWindow !== window) {
    // Create the HTML content using modern DOM manipulation
    const htmlContent = createMobilePdfViewerContent(fileURL, invoiceId);

    // Use innerHTML instead of document.write
    newWindow.document.documentElement.innerHTML = htmlContent;

    return true;
  } else {
    // If popup is blocked, fallback to direct link approach
    const link = document.createElement(`a`);
    link.href = fileURL;
    link.target = `_blank`;
    link.rel = `noopener noreferrer`;

    // For better mobile experience, add download attribute as fallback
    link.download = `invoice-${invoiceId}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 5000);

    return false;
  }
};
