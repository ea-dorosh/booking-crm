import {
  Edit as EditIcon,
  PictureAsPdf as DownloadIcon,
  Visibility as ViewIcon,
  IosShare as ShareIcon,
} from "@mui/icons-material";
import {
  IconButton,
  Button,
  Chip,
  Box,
  Typography,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import ListItemText from "@/components/ListItemText/ListItemText";
import { formatIsoDate } from "@/utils/formatters";

export default function InvoiceDetails({
  invoice,
  onChangeInvoiceClick,
  onDownloadInvoiceClick,
  onViewInvoiceClick,
  onShareInvoiceClick,
}) {

  return (
    <Box>
      <Box
        sx={{
          display: `flex`,
          alignItems: `center`,
        }}
      >
        <Box
          sx={{
            display: `flex`,
            justifyContent: `space-between`,
            alignItems: `center`,
            flexGrow: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: `bold`,
              fontSize: `1.2rem`,
            }}
          >
          Status
          </Typography>

          <Box
            sx={{
              display: `flex`,
              gap: `1rem`,
              flexWrap: `wrap`,
            }}
          >
            {invoice.status === 1 ?
              <Chip
                label="Paid"
                color="success"
              /> :
              <Chip
                label="Unpaid"
                color="primary"
              />}
          </Box>
        </Box>

        <Box
          sx={{ display: `flex` }}
        >
          <Tooltip title="Share PDF">
            <IconButton onClick={onShareInvoiceClick}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            title="View PDF"
          >
            <IconButton
              onClick={onViewInvoiceClick}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            title="Download PDF"
          >
            <IconButton
              onClick={onDownloadInvoiceClick}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          border: `1px solid #e0e0e0`,
          borderRadius: `4px`,
          p: `1rem`,
          mt: `1rem`,
          backgroundColor: `#f5f5f5`,
        }}
      >
        <Box
          sx={{
            display: `flex`,
            gap: `1rem`,
            flexWrap: `wrap`,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: `bold` }}
          >
          Invoice #{invoice.invoiceNumber}
          </Typography>
        </Box>

        <Box
          sx={{
            display: `flex`,
            gap: `1rem`,
            flexWrap: `wrap`,
          }}
        >
          <ListItemText
            value={formatIsoDate(invoice.dateIssued)}
            label="Date Issued"
          />

          <ListItemText
            value={formatIsoDate(invoice.dueDate)}
            label="Due Date"
          />
        </Box>

        <Box
          mt={`1rem`}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: `bold`,
              fontSize: `1rem`,
            }}
          >
            {invoice.company.name}
          </Typography>

          <Typography
            variant="body1"
          >
            {invoice.company.address}
          </Typography>

          <Typography
            variant="body1"
          >
            {invoice.company.email}
          </Typography>

          <Typography
            variant="body1"
          >
          Phone: {invoice.company.phone}
          </Typography>

          <Typography
            variant="body1"
          >
            {invoice.company.website}
          </Typography>

          <Typography
            variant="body1"
          >
         Company ID: {invoice.company.taxNumber}
          </Typography>

          <Typography
            variant="body1"
            mt={`.5rem`}
          >
          IBAN: {invoice.company.bankAccount}
          </Typography>
        </Box>


        <Typography
          variant="h6"
          sx={{
            fontWeight: `bold`,
            fontSize: `1rem`,
            mt: `1rem`,
          }}
        >
        Rechnung für:
        </Typography>


        <RouterLink
          to={`/customers/${invoice.customer.id}`}
          style={{
            textDecoration: `none`,
            color: `inherit`,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              textDecoration: `underline`,
              color: `#1976d2`,
              mt: `.5rem`,
            }}
          >
            {invoice.customer.lastName} {invoice.customer.firstName}
          </Typography>
        </RouterLink>

        <Typography
          variant="body1"
        >
          {invoice.customer.email}
        </Typography>

        <Typography
          variant="body1"
        >
          {invoice.customer.phone}
        </Typography>

        {invoice.servicesItems &&
      <Box
        sx={{
          borderTop: `1px solid #e0e0e0`,
          mt: `1rem`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: `bold`,
            mt: `1rem`,
          }}
        >Products & Services
        </Typography>

        <Box
          sx={{
            display: `flex`,
            flexDirection: `column`,
            gap: `1rem`,
            mt: `.5rem`,
          }}
        >
          {invoice.servicesItems.map(serviceItem => (
            <Box
              key={serviceItem.id}
              sx={{
                borderBottom: `1px solid #e0e0e0`,
                pb: `.5rem`,
              }}
            >
              <Box
                sx={{ display: `flex` }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: `bold`,
                    mr: `1rem`,
                  }}
                >{serviceItem.serviceName}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: `bold`,
                    ml: `auto`,
                    whiteSpace: `nowrap`,
                  }}
                >{serviceItem.serviceTotalAmount} €
                </Typography>
              </Box>

              <Box
                sx={{ mt: `.5rem` }}
              >
                <Typography
                  variant="body2"
                >{serviceItem.serviceQuantity} x {serviceItem.servicePrice} €
                </Typography>
                <Typography
                  variant="body2"
                >{Number(serviceItem.serviceTaxRate)}% Tax
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>}

        <Typography
          variant="h6"
          sx={{
            mt: `1rem`,
            fontWeight: `bold`,
          }}
        >Summary
        </Typography>

        <Box
          sx={{

          }}
        >
          <Box
            sx={{
              display: `flex`,
              justifyContent: `space-between`,
            }}
          >
            <Typography
              variant="body1"
              sx={{ fontWeight: `bold` }}
            >Subtotal
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: `bold` }}
            >{invoice.subtotal} €
            </Typography>
          </Box>

          <Box
            sx={{
              display: `flex`,
              justifyContent: `space-between`,
            }}
          >
            <Typography
              variant="body1"
              sx={{ fontWeight: `bold` }}
            >MwSt. (19%)
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: `bold` }}
            >{invoice.taxes} €
            </Typography>
          </Box>

          <Box
            sx={{
              display: `flex`,
              justifyContent: `space-between`,
              mt: `1rem`,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: `bold`,
                fontSize: `1.2rem`,
              }}
            >Total
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: `bold`,
                fontSize: `1.2rem`,
              }}
            >{invoice.totalAmount} €
            </Typography>
          </Box>
        </Box>

        <Button
          startIcon={<EditIcon />}
          onClick={onChangeInvoiceClick}
          variant="outlined"
          sx={{
            mt: 2,
            width: `100%`,
          }}
        >
        Change Invoice Details
        </Button>
      </Box>
    </Box>
  );
}
