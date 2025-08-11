import { Edit as EditIcon } from "@mui/icons-material";
import {
  Typography,
  Button,
  List,
} from "@mui/material";
import ListItemText from "@/components/ListItemText/ListItemText";


export default function CustomerDetails({
  customer, onChangeCustomerClick, 
}) {
  return (
    <List>
      <ListItemText
        value={`${customer.lastName || `-`} ${customer.firstName || `-`}`}
        label="Name"
      />

      <ListItemText
        value={customer.email}
        label="Email"
      />

      <ListItemText
        value={customer.phone}
        label="Phone"
      />

      <ListItemText
        value={customer.addedDate}
        label="Added"
      />

      <Typography
        variant="h6"
        color="text.secondary">
        Address
      </Typography>

      <ListItemText
        value={customer.addressStreet}
        label="Street"
      />

      <ListItemText
        value={customer.addressZip}
        label="Zip"
      />

      <ListItemText
        value={customer.addressCity}
        label="City"
      />

      <ListItemText
        value={customer.addressCountry}
        label="Country"
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
