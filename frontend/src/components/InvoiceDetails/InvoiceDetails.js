import EditIcon from "@mui/icons-material/Edit";
import {
  Button, 
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { formatIsoDate } from "@/utils/formatters";

export default function CustomerDetails({ invoice, onChangeInvoiceClick }) {

  return (
    <Box sx={{
      border: `1px solid #e0e0e0`,
      borderRadius: `4px`,
      p: `1rem`,
      backgroundColor: `#f5f5f5`,
    }}>
      <Box sx={{
        display: `flex`,
        gap: `1rem`,
        flexWrap: `wrap`,
      }}>
        <ListItemText
          primary={`${invoice.invoiceNumber}`}
          secondary="Number"
          sx={{ 
            flex: `0 0 120px`,
            display: `flex`,
            flexDirection: `column-reverse`,
          }}
        />

        <ListItemText
          primary={invoice.status === 1 ? `Paid` : `Unpaid`}
          secondary="Status"
          sx={{ 
            flex: `0 0 120px`,
            display: `flex`,
            flexDirection: `column-reverse`,
          }}
        />

      </Box>

      <Box sx={{
        display: `flex`,
        gap: `1rem`,
        flexWrap: `wrap`,
      }}>
        <ListItemText
          primary={formatIsoDate(invoice.dateIssued)}
          secondary="Date Issued"
          sx={{ 
            flex: `0 0 120px`,
            display: `flex`,
            flexDirection: `column-reverse`,
          }}
        />

        <ListItemText
          primary={formatIsoDate(invoice.dueDate)}
          secondary="Due Date"
          sx={{ 
            flex: `0 0 120px`,
            display: `flex`,
            flexDirection: `column-reverse`,
          }}
        />
      </Box>

      <RouterLink to={`/customers/${invoice.customer.id}`} style={{textDecoration: `none`, color: `inherit`}}>
        <ListItemText
          primary={`${invoice.customer.lastName} ${invoice.customer.firstName}`}
          secondary="Client"
          sx={{ 
            flex: `0 0 100%`,
            display: `flex`,
            flexDirection: `column-reverse`,

            '& .MuiListItemText-primary': {
              textDecoration: `underline`,
              color: `#1976d2`, 
            },
          }}
        />
      </RouterLink>

      <ListItemText
        primary={invoice.customer.email}
        secondary="Email"
        sx={{ 
          flex: `0 0 100%`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={invoice.customer.phone}
        secondary="Phone"
        sx={{ 
          flex: `0 0 100%`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      {invoice.servicesItems && <Box sx={{ borderTop: `1px solid #e0e0e0` }}>
        <Typography variant="h6" sx={{fontWeight: `bold`, mt: `1rem`}}>Products & Services</Typography>

        <Box sx={{ display: `flex`, flexDirection: `column`, gap: `1rem`, mt: `.5rem` }}>
          {invoice.servicesItems.map(serviceItem => (
            <Box key={serviceItem.id}
              sx={{
                borderBottom: `1px solid #e0e0e0`,
                pb: `.5rem`,
              }}
            >
              <Box sx={{ display: `flex` }}>
                <Typography variant="body1"
                  sx={{ fontWeight: `bold`, mr: `1rem` }}
                >{serviceItem.serviceName}</Typography>
                <Typography variant="body1" 
                  sx={{ fontWeight: `bold`, ml: `auto`, whiteSpace: `nowrap` }}
                >{serviceItem.serviceTotalAmount} €</Typography>
              </Box>

              <Box sx={{ mt: `.5rem` }}>
                <Typography variant="body2">{serviceItem.serviceQuantity} x {serviceItem.servicePrice} €</Typography>
                <Typography variant="body2">{Number(serviceItem.serviceTaxRate)}% Tax  </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>}

      <Typography variant="h6" sx={{ mt: `1rem`, fontWeight: `bold` }}>Summary</Typography>

      <Box sx={{

      }}>
        <Box sx={{ display: `flex`, justifyContent: `space-between` }}>
          <Typography variant="body1" sx={{ fontWeight: `bold` }}>Subtotal</Typography>
          <Typography variant="body1" sx={{ fontWeight: `bold` }}>{invoice.subtotal} €</Typography>
        </Box>

        <Box sx={{ display: `flex`, justifyContent: `space-between` }}>
          <Typography variant="body1" sx={{ fontWeight: `bold` }}>MwSt. (19%)</Typography>
          <Typography variant="body1" sx={{ fontWeight: `bold` }}>{invoice.taxes} €</Typography>
        </Box>

        <Box sx={{ display: `flex`, justifyContent: `space-between`, mt: `1rem` }}>
          <Typography variant="body1" sx={{ fontWeight: `bold`, fontSize: `1.2rem` }}>Total</Typography>
          <Typography variant="body1" sx={{ fontWeight: `bold`, fontSize: `1.2rem` }}>{invoice.totalAmount} €</Typography>
        </Box>
      </Box>

      <Button
        startIcon={<EditIcon />}
        onClick={onChangeInvoiceClick}
        variant="outlined"
        sx={{ mt: 2, width: `100%` }}
      >
        Change Invoice Details
      </Button>
    </Box>
  );
}
