import {
  AddCircle,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';

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
              justifyContent: `space-between`,
              width: `100%`,
              gap: `1rem`,
              padding: `.4rem 0 .4rem 0`,
              borderBottom: `1px solid #ddd`,
              textDecoration: `none`,
              color: `#333`,
              position: `relative`,
            }}
          >
            <Box>
              <Typography sx={{
                fontSize: `1.1rem`,
                fontWeight: `bold`,
              }}>
                {invoice.customer.lastName} {invoice.customer.firstName}
              </Typography>

              <Typography sx={{
                fontSize: `1rem`,
              }}>
                #{invoice.invoiceNumber}
              </Typography>
            </Box>

            <Box textAlign="right">
              <Typography sx={{
                fontSize: `1.1rem`,
              }}>
                {invoice.totalAmount}€
              </Typography>

              <Typography
                sx={{
                  fontSize: `.8rem`,
                  color: `green`,
                }}
              >
                {invoice.status === 1 ? `Paid` : ``}
              </Typography>
            </Box>

          </Box>
        ))}
      </Box>
    </Box>
  );
}