import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  List,
  ListItemText,
} from "@mui/material";
import { useState } from "react";
import CompanyBranchForm from "@/components/CompanyBranchForm/CompanyBranchForm";

export default function CompanyBranchDetails({
  branch,
  submitForm,
  formErrors,
  cleanError,
  cleanErrors,
  isPending,
  onEditModeClick,
  disabledEditMode,
}) {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <Box>
      {!isEditMode && <List>
        <ListItemText
          primary={branch.name || `-`}
          secondary="Name"
          sx={{
            flex: `0 0 200px`,
            display: `flex`,
            flexDirection: `column-reverse`,
          }}
        />

        <ListItemText
          primary={`${branch.addressStreet}, ${branch.addressZip} ${branch.addressCity}, ${branch.addressCountry}`}
          secondary="Address"
          sx={{
            flex: `0 0 200px`,
            display: `flex`,
            flexDirection: `column-reverse`,
          }}
        />

        <ListItemText
          primary={branch.phone || `-`}
          secondary="Phone"
          sx={{
            flex: `0 0 200px`,
            display: `flex`,
            flexDirection: `column-reverse`,
          }}
        />

        <ListItemText
          primary={branch.email || `-`}
          secondary="Email"
          sx={{
            flex: `0 0 200px`,
            display: `flex`,
            flexDirection: `column-reverse`,
          }}
        />
      </List>}

      {isEditMode && <CompanyBranchForm
        branch={branch}
        submitForm={submitForm}
        formErrors={formErrors}
        cleanError={cleanError}
        cleanErrors={cleanErrors}
        isPending={isPending}
        onCancelClick={() => setIsEditMode(false)}
      />}

      {!isEditMode && !disabledEditMode && <Button
        startIcon={<EditIcon />}
        onClick={() => {
          setIsEditMode(true);
          onEditModeClick();
        }}
        variant="outlined"
        sx={{ mt: 2 }}
      >
        Change Branch Details
      </Button>}
    </Box>
  );
}
