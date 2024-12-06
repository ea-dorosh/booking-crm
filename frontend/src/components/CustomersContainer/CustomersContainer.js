import { 
  AddCircle,
} from "@mui/icons-material";
import { 
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from 'react-router-dom';
import CustomersSorting from "@/components/CustomersSorting/CustomersSorting";
import { formatFromDateTimeToStringDate } from "@/utils/formatters";

export default function CustomersContainer({ 
  customers,
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
          add customer
        </Typography>

        <RouterLink to={`/customers/create-customer`}>
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
        <CustomersSorting />
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
        {customers.map((customer) => (
          <Box
            key={customer.id}
            component={RouterLink}
            to={`/customers/${customer.id}`}
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
              Added: {formatFromDateTimeToStringDate(customer.addedDate)}
            </Typography>

            <Typography sx={{
              fontSize: `1rem`,
              fontWeight: `bold`,
            }}>
              {customer.lastName} {customer.firstName}
            </Typography>

            <Typography sx={{
              fontSize: `.8rem`,
            }}>
              {customer.email}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}