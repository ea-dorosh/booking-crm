import { 
  AddCircle,
} from "@mui/icons-material";
import { 
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import { formatIsoDate } from "@/utils/formatters";

export default function InvoicesContainer({ 
  invoices,
}) {
  return (
    <Box>
      <Box
        sx={{
          display: `flex`,
          alignItems: `center`,
          marginTop: `20px`,
          marginLeft: `auto`,
          backgroundColor: `#1976d2`,
          width: `fit-content`,
          padding: `10px 20px 10px 30px`,
          borderRadius: `50px`,
        }}
      >
        <Typography variant="button"
          sx={{color: `#fff`}}
        >
          add invoice
        </Typography>

        <RouterLink to={`/invoices/create-invoice`}>
          <IconButton
            sx={{color: `#fff`}}
          >
            <AddCircle />
          </IconButton>
        </RouterLink>
      </Box>

      <Box sx={{
        display: `flex`,
        justifyContent: `flex-end`,
        mt: `1rem`,
      }}>
        {/* <CustomersSorting /> */}
      </Box>
  

      <Box
        sx={{
          display: `flex`,
          flexDirection: `column`,
          gap: `.5rem`,
          marginTop: `.4rem`,
          maxWidth: `768px`,
        }}
      >
        {invoices.map((invoice) => (
          <Box
            key={invoice.id}
            component={RouterLink}
            to={`/invoices/${invoice.id}`}
            sx={{
              display: `flex`,
              alignItems: `flex-start`,
              flexDirection: `column`,
              width: `100%`,
              gap: `.4rem`,
              padding: `.8rem 0 .4rem 0`,
              borderBottom: `1px solid #ddd`,
              textDecoration: `none`,
              color: `#333`,
              position: `relative`,
            }}
          >
            <Typography 
              sx={{
                fontSize: `.8rem`,
                color: `green`,
                marginLeft: `auto`,
                position: `absolute`,
                right: `0`,
                top: `-4px`,
              }}
            >
              {invoice.status === 1 ? `Paid` : ``}
            </Typography>

            <Typography sx={{
              fontSize: `1rem`,
              fontWeight: `bold`,
            }}>
              {invoice.invoiceNumber} {formatIsoDate(invoice.dateIssued)}
            </Typography>

            <Typography sx={{
              fontSize: `1rem`,
            }}>
              {invoice.customer.lastName} {invoice.customer.firstName}
            </Typography>

            <Typography sx={{
              fontSize: `.8rem`,
            }}>
              Subtotal: <b>{invoice.subtotal} €</b> <br/> 
              Tax: <b>{invoice.taxes ? `${invoice.taxes} €` : `-`}</b> <br/>
              Total: <b>{invoice.totalAmount} €</b>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}