import EditIcon from "@mui/icons-material/Edit";
import {
  Button, 
  List,
  ListItemText,
} from "@mui/material";


export default function CustomerDetails({ customer, onChangeCustomerClick }) {
  return (
    <List>
      <ListItemText
        primary={`${customer.lastName || `-`} ${customer.firstName || `-`}`}
        secondary="Name"
        sx={{ 
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={customer.email}
        secondary="Email"
        sx={{ 
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={customer.phone || `-`}
        secondary="Phone"
        sx={{ 
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={customer.addedDate || `-`}
        secondary="Added"
        sx={{ 
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <Button
        startIcon={<EditIcon />}
        onClick={onChangeCustomerClick}
        variant="outlined"
        sx={{ mt: 2 }}
      >
        Change Customer Details
      </Button>
    </List>
  );
}
