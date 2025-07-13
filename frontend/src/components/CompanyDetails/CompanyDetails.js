import EditIcon from "@mui/icons-material/Edit";
import {
  Button,
  List,
} from "@mui/material";
import ListItemText from "@/components/ListItemText/ListItemText";

export default function CompanyDetails({ company, onChangeCompanyClick }) {
  return (
    <List>
      <ListItemText
        value={company.name}
        label="Name"
      />

      <ListItemText
        value={company.email}
        label="Email"
      />

      <ListItemText
        value={company.phone}
        label="Phone"
      />

      <ListItemText
        value={company.website}
        label="Website"
      />

      <ListItemText
        value={`${company.addressStreet}, ${company.addressZip} ${company.addressCity}, ${company.addressCountry}`}
        label="Address"
      />

      <ListItemText
        value={company.taxNumber}
        label="Tax Number"
      />

      <ListItemText
        value={company.bankAccount}
        label="Bank Account"
      />

      <Button
        startIcon={<EditIcon />}
        onClick={onChangeCompanyClick}
        variant="outlined"
        sx={{ mt: 2 }}
      >
        Change Company Details
      </Button>
    </List>
  );
}
