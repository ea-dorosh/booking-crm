import EditIcon from "@mui/icons-material/Edit";
import {
  Button,
  List,
  ListItemText,
} from "@mui/material";

export default function CompanyDetails({ company, onChangeCompanyClick }) {
  return (
    <List>
      <ListItemText
        primary={company.name || `-`}
        secondary="Name"
        sx={{
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={company.email}
        secondary="Email"
        sx={{
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={company.phone || `-`}
        secondary="Phone"
        sx={{
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={company.website || `-`}
        secondary="Website"
        sx={{
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={`${company.addressStreet}, ${company.addressZip} ${company.addressCity}, ${company.addressCountry}`}
        secondary="Address"
        sx={{
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={company.taxNumber || `-`}
        secondary="Tax Number"
        sx={{
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
      />

      <ListItemText
        primary={company.bankAccount || `-`}
        secondary="Bank Account"
        sx={{
          flex: `0 0 200px`,
          display: `flex`,
          flexDirection: `column-reverse`,
        }}
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
